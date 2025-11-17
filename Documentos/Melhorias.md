Sugestão de prompts para o Cursor (fases de desenvolvimento)
A seguir estão prompts sugeridos para serem enviados ao Cursor em diferentes fases de desenvolvimento. Cada prompt deve ser adaptado conforme a estrutura do projeto (provavelmente um projeto Next.js com API Routes) e a base de dados utilizada (SQLite/PostgreSQL). O objetivo é implementar as melhorias de maneira incremental.
Fase 1 – Metas de medidas e correções de navegação
Contexto: O botão “Definir Meta” na página de gráfico /tracker/[id] do ShapeFlow não possui funcionalidade. O botão “Voltar” também não retorna à lista de medidas.
Objetivo: Criar um recurso de metas para cada medida e corrigir a navegação.
Tarefas:
1. Adicionar tabela/modelo goal no banco de dados, relacionada ao usuário e à medida, contendo valores targetValue, deadline e createdAt.
2. No frontend (página do gráfico), implementar modal ao clicar em Definir Meta com campos de valor desejado e data limite; ao salvar, chamar API POST /api/goals para persistir a meta.
3. Na página de gráfico, desenhar uma linha horizontal na posição da meta (caso exista) e exibir progresso (% alcançado).
4. Ajustar o botão “Voltar” para chamar router.push('/tracker') em vez de #, garantindo retorno à lista.
5. Criar testes para garantir que metas são salvas e exibidas corretamente e que a navegação funciona.
Fase 2 – Novas medidas e relatórios
Contexto: O ShapeFlow atualmente rastreia somente Peso e Cintura, e exporta dados simples.
Objetivo: Permitir adicionar medidas corporais adicionais e gerar relatórios.
Tarefas:
1. Atualizar o esquema de banco para aceitar medidas predefinidas como altura, quadril, peito, braço, percentual de gordura, pressão arterial e frequência cardíaca.
2. Modificar a interface de criação de nova medida para incluir sugestões de unidades (cm, kg, %, mmHg etc.) e um campo opcional de observação para cada lançamento.
3. Implementar exportação de relatórios em PDF/CSV com gráfico de evolução em intervalos semanal/mensal usando bibliotecas como pdfmake ou jspdf.
4. Adicionar um campo de notas por registro e atualizar API para persistir esse campo.
Fase 3 – Diário alimentar e rastreamento de macros
Contexto: O sistema não possui diário alimentar ou contador de calorias.
Objetivo: Criar módulo para registro de refeições e cálculo de calorias/macronutrientes.
Tarefas:
1. Adicionar modelos FoodItem e MealEntry ao banco, associando cada entrada a data, refeição (café, almoço, etc.) e porção.
2. Integrar com um banco de dados de alimentos (pode iniciar com um JSON estático; depois integrar API externa) contendo valores calóricos e macronutrientes.
3. Criar página Diário Alimentar com busca e seleção de alimentos; exibir total diário de calorias, proteínas, carboidratos e gorduras.
4. Implementar componente para scanner de código de barras (usando biblioteca de câmera e decodificação) e futuramente integração com OCR/foto.
5. Adicionar metas de calorias e macronutrientes por dia e mostrar barras de progresso.
Fase 4 – Hidratação e jejum intermitente
Objetivo: Adicionar módulos de hidratação e jejum intermitente.
Tarefas:
1. Criar modelo WaterIntake com campos amount, timestamp e objetivo diário configurável por usuário.
2. Criar interface para registrar consumo de água (botões de quantidade ou campo numérico) e exibir barra de progresso.
3. Implementar FastingSchedule com tipos de jejum (16:8, 14:10 etc.), armazenamento de início/fim do período e timers.
4. Exibir contagem regressiva e enviar notificações no navegador quando o período de jejum ou alimentação iniciar/terminar.
5. Permitir ao usuário acompanhar histórico de jejuns e consumo de água.
Fase 5 – Receitas e planejamento alimentar
Objetivo: Fornecer biblioteca de receitas e plano alimentar.
Tarefas:
1. Integrar uma API de receitas (ou usar banco próprio) contendo informações de ingredientes, calorias e porções.
2. Criar páginas de exploração de receitas com filtros por preferências (vegetariano, vegano, low carb) e calorias.
3. Permitir que o usuário selecione receitas para cada refeição da semana; gerar lista de compras automaticamente.
4. Ao selecionar uma receita, adicionar seus nutrientes automaticamente ao diário alimentar.
Fase 6 – Integração com dispositivos e atividades
Objetivo: Sincronizar dados de passos e atividade.
Tarefas:
1. Investigar uso das APIs do Google Fit/Apple Health e implementar rotinas de sincronização (com OAuth).
2. Criar scheduler que periodicamente atualiza passos, gasto calórico e outras métricas no banco.
3. Exibir essas informações no dashboard e usá-las para ajustar o balanço calórico diário (soma de calorias ingeridas e gastas).
4. Integrar com balanças inteligentes e pulseiras (Fitbit, Garmin) para importar peso e gordura corporal.
Fase 7 – Funcionalidades sociais e gamificação
Objetivo: Criar engajamento entre usuários.
Tarefas:
1. Adicionar modelos de grupo, desafio e participação; permitir que usuários criem ou entrem em desafios semanais (por exemplo, atingir meta de passos ou água).
2. Implementar feed social simples com posts de progresso e comentários.
3. Criar sistema de conquistas e badges por metas atingidas (dias consecutivos de registro, metas de peso etc.).
4. Adicionar notificação de menções/comentários.
Fase 8 – Inteligência artificial e entrada facilitada
Objetivo: Melhorar a experiência de entrada de dados.
Tarefas:
1. Integrar serviço de reconhecimento de imagem (Google Vision ou AWS Rekognition) para identificar alimentos a partir de fotos; mapear resultados ao banco de alimentos.
2. Implementar entrada por voz usando Web Speech API para cadastrar refeições ou medidas.
3. Desenvolver assistente de recomendações que sugira receitas ou ajuste de metas com base nos hábitos e preferências do usuário usando modelos de IA generativa.
Fase 9 – Melhoria da administração e relatórios corporativos
Objetivo: Evoluir a Central Administrativa.
Tarefas:
1. Adicionar filtros por data de cadastro, status de assinatura e papel.
2. Incluir página de auditoria com histórico de ações de cada usuário (criações, edições, exclusões).
3. Permitir gerenciamento de planos de assinatura (ativação, cancelamento, renovação) e geração de faturas.
4. Criar funcionalidade de envio de newsletters ou alertas em massa a usuários selecionados.
Fase 10 – Experiência e acessibilidade
Objetivo: Refinar a interface e fornecer suporte educacional.
Tarefas:
1. Implementar tema claro/escuro alternável no sistema, salvando preferência no perfil do usuário.
2. Adicionar controle de tamanho de fonte e contrastes para acessibilidade.
3. Criar tutoriais interativos (onboarding) com passo a passo para novos usuários e dicas de uso inspiradas nas lições do Noom[17].
4. Incluir seção de artigos educativos sobre nutrição, jejum e exercícios.
