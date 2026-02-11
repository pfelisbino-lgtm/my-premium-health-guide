

# HealthJourney - Fase 1
**"O teu guia completo para uma vida mais saudável."**

App Web Instalável (PWA) de entrega de conteúdo premium para utilizadores que completaram o quiz de emagrecimento.

---

## 🎨 Design & Identidade Visual
- Paleta de cores: tons de verde, azul claro e branco — transmitindo saúde e bem-estar
- Design moderno, limpo e mobile-first
- Ícones intuitivos e tipografia legível
- Configuração PWA para instalação no telemóvel

---

## 1. Autenticação e Controlo de Acesso
- **Página de Registo** com nome, email e password
- **Página de Login** e "Esqueci a Senha"
- **Integração Hotmart via Webhook**: edge function que recebe notificações da Hotmart quando alguém compra, ativando automaticamente o acesso premium no backend
- Utilizadores sem acesso ativo veem uma tela a indicar que precisam adquirir o plano

## 2. Dashboard Personalizado
- **Metas de peso** com progresso visual
- **Recomendações diárias** (receita do dia, dica do dia)
- **Acesso rápido** via cards para Receitas, Perfil e outras secções
- Saudação personalizada com o nome do utilizador

## 3. Módulo de Receitas (com dados de exemplo)
- **Biblioteca de receitas** categorizadas (café da manhã, almoço, jantar, lanches, sobremesas)
- **Detalhes completos**: ingredientes, modo de preparo, informações nutricionais, tempo, dificuldade
- **Filtros**: por tipo de refeição, restrição alimentar, tempo de preparo
- **Favoritos**: guardar receitas preferidas

## 4. Perfil e Configurações
- Editar nome e email
- Gerir preferências alimentares
- Ver estado da assinatura (ativa/inativa)
- Secção de FAQ/Suporte

---

## 🔧 Backend (Lovable Cloud)
- Base de dados para perfis de utilizadores, estado de assinatura e receitas favoritas
- Edge function para webhook da Hotmart (validação automática de compras)
- Autenticação segura com Supabase Auth
- RLS para proteger dados dos utilizadores

---

## 📱 Próximas Fases (após Fase 1)
- Módulo de Exercícios e Treinos com vídeos
- Acompanhamento de Progresso (peso, medidas, gráficos)
- Planos Alimentares semanais/mensais
- Dicas, Artigos e Protocolos Específicos
- Notificações Push
- Desafios internos

