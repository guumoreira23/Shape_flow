import { NextRequest } from "next/server"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { chatMessageSchema } from "@/lib/utils/zod"
import { createSSEStream, formatSSEMessage } from "@/lib/utils/sse"
import OpenAI from "openai"
import { eq, and, gte, desc } from "drizzle-orm"
import { getTodayDate } from "@/lib/utils/date"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function getUserMetricsSummary(userId: string) {
  const thirtyDaysAgo = new Date(getTodayDate())
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const entries = await db.query.measurementEntries.findMany({
    where: (entries, { eq, gte }) =>
      and(
        eq(entries.userId, userId),
        gte(entries.date, thirtyDaysAgo)
      ),
    orderBy: (entries, { desc }) => [desc(entries.date)],
  })

  const values = await db.query.measurementValues.findMany({
    where: (values, { inArray }) =>
      inArray(
        values.entryId,
        entries.map((e) => e.id)
      ),
  })

  const measures = await db.query.measurementTypes.findMany({
    where: (types, { eq }) => eq(types.userId, userId),
  })

  const userGoals = await db.query.goals.findMany({
    where: (goals, { eq }) => eq(goals.userId, userId),
  })

  const summary = measures.map((measure) => {
    const measureValues = values.filter(
      (v) => v.measureTypeId === measure.id
    )
    const goal = userGoals.find((g) => g.measureTypeId === measure.id)

    if (measureValues.length === 0) {
      return {
        measureId: measure.id,
        name: measure.name,
        unit: measure.unit,
        hasData: false,
      }
    }

    const numericValues = measureValues.map((v) => v.value)
    const latest = numericValues[0]
    const avg = Math.round(
      numericValues.reduce((a, b) => a + b, 0) / numericValues.length
    )
    const min = Math.min(...numericValues)
    const max = Math.max(...numericValues)

    return {
      measureId: measure.id,
      name: measure.name,
      unit: measure.unit,
      hasData: true,
      latest,
      average: avg,
      min,
      max,
      goal: goal?.targetValue || null,
    }
  })

  return summary
}

async function setGoal(measureId: number, targetValue: number, userId: string) {
  const measureType = await db.query.measurementTypes.findFirst({
    where: (types, { eq, and }) =>
      and(eq(types.id, measureId), eq(types.userId, userId)),
  })

  if (!measureType) {
    throw new Error("Tipo de medida não encontrado")
  }

  const existingGoal = await db.query.goals.findFirst({
    where: (goals, { eq, and }) =>
      and(
        eq(goals.userId, userId),
        eq(goals.measureTypeId, measureId)
      ),
  })

  if (existingGoal) {
    await db
      .update(goals)
      .set({
        targetValue,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, existingGoal.id))
  } else {
    await db.insert(goals).values({
      userId,
      measureTypeId: measureId,
      targetValue,
    })
  }

  return { success: true }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = chatMessageSchema.parse(body)

    const metricsSummary = await getUserMetricsSummary(user.id)

    const metricsContext = metricsSummary
      .filter((m) => m.hasData)
      .map(
        (m) =>
          `${m.name} (${m.unit}): Última: ${m.latest}, Média: ${m.average}, Mín: ${m.min}, Máx: ${m.max}${m.goal ? `, Meta: ${m.goal}` : ""}`
      )
      .join("\n")

    const systemPrompt =
      process.env.THAIS_CARLA_SYSTEM_PROMPT ||
      "Você é Thais Carla, uma coach de fitness e nutrição motivacional e empática. Ajude os usuários a alcançarem seus objetivos de saúde e bem-estar com dicas práticas e encorajamento."

    const enrichedSystemPrompt = `${systemPrompt}\n\nContexto das métricas do usuário nos últimos 30 dias:\n${metricsContext || "Nenhuma métrica registrada ainda."}`

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (process.env.ASSISTANT_ID_THAS_CARLA) {
            const assistantId = process.env.ASSISTANT_ID_THAS_CARLA
            const thread = await openai.beta.threads.create()

            await openai.beta.threads.messages.create(thread.id, {
              role: "user",
              content: validatedData.message,
            })

            const run = await openai.beta.threads.runs.create(thread.id, {
              assistant_id: assistantId,
            })

            let runStatus = await openai.beta.threads.runs.retrieve(
              thread.id,
              run.id
            )

            while (runStatus.status === "in_progress" || runStatus.status === "queued") {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
            }

            if (runStatus.status === "requires_action") {
              const toolCalls = runStatus.required_action?.submit_tool_outputs?.tool_calls || []
              const toolOutputs = []

              for (const toolCall of toolCalls) {
                if (toolCall.function.name === "getUserMetricsSummary") {
                  const result = metricsSummary
                  toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(result),
                  })
                } else if (toolCall.function.name === "setGoal") {
                  const args = JSON.parse(toolCall.function.arguments || "{}")
                  const result = await setGoal(
                    args.measureId,
                    args.targetValue,
                    user.id
                  )
                  toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(result),
                  })
                }
              }

              await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
                tool_outputs: toolOutputs,
              })

              runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
              while (runStatus.status === "in_progress" || runStatus.status === "queued") {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
              }
            }

            const messages = await openai.beta.threads.messages.list(thread.id, {
              limit: 1,
            })

            const assistantMessage = messages.data[0]?.content[0]
            if (
              assistantMessage &&
              "text" in assistantMessage &&
              assistantMessage.text.value
            ) {
              const text = assistantMessage.text.value
              const chunks = text.split(" ")
              for (const chunk of chunks) {
                controller.enqueue(
                  new TextEncoder().encode(formatSSEMessage(chunk + " "))
                )
              }
            }
          } else {
            const completion = await openai.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                { role: "system", content: enrichedSystemPrompt },
                { role: "user", content: validatedData.message },
              ],
              stream: true,
              tools: [
                {
                  type: "function",
                  function: {
                    name: "getUserMetricsSummary",
                    description:
                      "Retorna um resumo das métricas do usuário nos últimos 30 dias",
                    parameters: {
                      type: "object",
                      properties: {},
                      required: [],
                    },
                  },
                },
                {
                  type: "function",
                  function: {
                    name: "setGoal",
                    description: "Define ou atualiza a meta de uma medida",
                    parameters: {
                      type: "object",
                      properties: {
                        measureId: {
                          type: "number",
                          description: "ID do tipo de medida",
                        },
                        targetValue: {
                          type: "number",
                          description: "Valor da meta",
                        },
                      },
                      required: ["measureId", "targetValue"],
                    },
                  },
                },
              ],
            })

            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta
              if (delta?.content) {
                controller.enqueue(
                  new TextEncoder().encode(formatSSEMessage(delta.content))
                )
              }
              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls || []) {
                  if (toolCall.function?.name === "setGoal") {
                    const args = JSON.parse(toolCall.function.arguments || "{}")
                    await setGoal(args.measureId, args.targetValue, user.id)
                  }
                }
              }
            }
          }

          controller.enqueue(new TextEncoder().encode(formatSSEMessage("[DONE]")))
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.enqueue(
            new TextEncoder().encode(
              formatSSEMessage("Erro ao processar mensagem")
            )
          )
          controller.close()
        }
      },
    })

    return createSSEStream(stream)
  } catch (error) {
    console.error("Chat error:", error)
    return new Response(
      JSON.stringify({ error: "Erro ao processar mensagem" }),
      { status: 500 }
    )
  }
}

