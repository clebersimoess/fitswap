import React from "react";
import { ArrowLeft, FileText, Shield, Users, Camera, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Termos de Uso</h1>
            <p className="text-xs text-gray-500">Última atualização: Novembro 2025</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] rounded-2xl p-6 text-white">
          <FileText className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao FitSwap</h2>
          <p className="opacity-90">
            Ao usar o FitSwap, você concorda com estes Termos de Uso. 
            Leia-os atentamente antes de continuar.
          </p>
        </div>

        {/* 1. Aceitação dos Termos */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              Ao criar uma conta, acessar ou usar o FitSwap, você concorda em estar vinculado 
              por estes Termos de Uso, todas as leis e regulamentos aplicáveis, e concorda 
              que é responsável pelo cumprimento de todas as leis locais aplicáveis.
            </p>
            <p>
              Se você não concordar com algum destes termos, está proibido de usar ou 
              acessar este aplicativo.
            </p>
          </div>
        </section>

        {/* 2. Descrição do Serviço */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h3>
          
          <p className="text-gray-600 text-sm mb-4">
            O FitSwap é uma rede social focada em fitness que permite:
          </p>

          <ul className="space-y-2 text-gray-600 text-sm">
            <li>✓ Compartilhar treinos, fotos e vídeos</li>
            <li>✓ Conectar-se com outros praticantes de atividades físicas</li>
            <li>✓ Participar de desafios fitness</li>
            <li>✓ Acompanhar seu progresso e conquistas</li>
            <li>✓ Interagir com instrutores de educação física</li>
            <li>✓ Participar de comunidades temáticas</li>
          </ul>
        </section>

        {/* 3. Cadastro e Conta do Usuário */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">3. Cadastro e Conta do Usuário</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">3.1. Idade Mínima</h4>
              <p>
                Você deve ter pelo menos <strong>13 anos</strong> para criar uma conta 
                no FitSwap. Usuários menores de 18 anos devem ter autorização dos pais ou responsáveis.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">3.2. Informações Verdadeiras</h4>
              <p>
                Você concorda em fornecer informações precisas, atuais e completas durante 
                o processo de registro e atualizar essas informações para mantê-las precisas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">3.3. Segurança da Conta</h4>
              <p>
                Você é responsável por manter a confidencialidade de sua senha e conta. 
                Você concorda em notificar-nos imediatamente sobre qualquer uso não autorizado 
                de sua conta.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Responsabilidades do Usuário */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">4. Responsabilidades do Usuário</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              Você é <strong>totalmente responsável</strong> por todo o conteúdo que publica 
              no FitSwap, incluindo:
            </p>

            <ul className="space-y-2 ml-4">
              <li>• Fotos e vídeos de treinos</li>
              <li>• Textos em posts e comentários</li>
              <li>• Stories e conteúdo temporário</li>
              <li>• Mensagens enviadas a instrutores ou outros usuários</li>
            </ul>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mt-4">
              <p className="text-sm text-orange-900">
                <strong>⚠️ Importante:</strong> O FitSwap não se responsabiliza por conteúdo 
                gerado por usuários. Cada usuário é responsável por suas próprias publicações 
                e interações.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Conduta Proibida */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">5. Conduta Proibida</h3>
          
          <p className="text-gray-600 text-sm mb-3">
            Ao usar o FitSwap, você <strong>NÃO PODE</strong>:
          </p>

          <div className="space-y-2 text-gray-600 text-sm">
            <div className="flex gap-2">
              <span>❌</span>
              <p>Publicar conteúdo ofensivo, discriminatório ou que promova ódio</p>
            </div>
            <div className="flex gap-2">
              <span>❌</span>
              <p>Compartilhar fotos ou vídeos inapropriados, nudez explícita</p>
            </div>
            <div className="flex gap-2">
              <span>❌</span>
              <p>Assediar, ameaçar ou intimidar outros usuários</p>
            </div>
            <div className="flex gap-2">
              <span>❌</span>
              <p>Violar direitos autorais ou propriedade intelectual de terceiros</p>
            </div>
            <div className="flex gap-2">
              <span>❌</span>
              <p>Fazer spam ou enviar mensagens não solicitadas</p>
            </div>
            <div className="flex gap-2">
              <span>❌</span>
              <p>Tentar hackear ou comprometer a segurança da plataforma</p>
            </div>
            <div className="flex gap-2">
              <span>❌</span>
              <p>Criar múltiplas contas falsas ou se passar por outra pessoa</p>
            </div>
          </div>
        </section>

        {/* 6. Moderação de Contas */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">6. Moderação e Remoção de Contas</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              O FitSwap <strong>reserva-se o direito de</strong>:
            </p>

            <ul className="space-y-2 ml-4">
              <li>• Remover qualquer conteúdo que viole estes termos</li>
              <li>• Suspender temporariamente contas que violem as regras</li>
              <li>• Banir permanentemente usuários reincidentes</li>
              <li>• Moderar conteúdo reportado por outros usuários</li>
              <li>• Tomar ações sem aviso prévio em casos graves</li>
            </ul>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
              <p className="text-sm text-red-900">
                <strong>⚠️ Violações graves</strong> (como assédio, conteúdo ilegal ou ameaças) 
                resultarão em <strong>banimento imediato</strong> e, se necessário, 
                comunicação às autoridades competentes.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Propriedade Intelectual */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">7. Propriedade Intelectual</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              <strong>Seu conteúdo:</strong> Você mantém todos os direitos sobre fotos, 
              vídeos e textos que publica. Ao publicar, você nos concede uma licença 
              para exibir esse conteúdo na plataforma.
            </p>
            <p>
              <strong>Conteúdo do FitSwap:</strong> O aplicativo, logotipo, design e 
              funcionalidades são de propriedade exclusiva do FitSwap e protegidos por 
              direitos autorais.
            </p>
          </div>
        </section>

        {/* 8. Isenção de Responsabilidade */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">8. Isenção de Responsabilidade</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              O FitSwap é fornecido "COMO ESTÁ". <strong>Não nos responsabilizamos por</strong>:
            </p>

            <ul className="space-y-2 ml-4">
              <li>• Lesões físicas resultantes de exercícios compartilhados no app</li>
              <li>• Conteúdo gerado por outros usuários</li>
              <li>• Disputas entre usuários</li>
              <li>• Perda de dados ou conteúdo</li>
              <li>• Problemas com serviços de instrutores terceiros</li>
              <li>• Interrupções temporárias do serviço</li>
            </ul>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ Atenção:</strong> Sempre consulte um médico ou profissional 
                de saúde antes de iniciar qualquer programa de exercícios.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Alterações nos Termos */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">9. Alterações nos Termos</h3>
          
          <p className="text-gray-600 text-sm">
            Podemos atualizar estes termos periodicamente. Você será notificado sobre 
            mudanças significativas através do aplicativo ou por email. O uso continuado 
            após as alterações constitui aceitação dos novos termos.
          </p>
        </section>

        {/* 10. Contato */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">10. Entre em Contato</h3>
          
          <p className="text-gray-600 text-sm mb-4">
            Se você tiver dúvidas sobre estes Termos de Uso, entre em contato:
          </p>

          <div className="space-y-2 text-gray-700 text-sm">
            <p><strong>Email:</strong> clebersimoessilva@gmail.com</p>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900">
              <strong>✓ Ao usar o FitSwap, você confirma que leu, compreendeu e 
              concorda com estes Termos de Uso.</strong>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-6">
          <p>FitSwap © 2025 - Todos os direitos reservados</p>
          <p className="mt-2">Última atualização: Novembro de 2025</p>
        </div>
      </div>
    </div>
  );
}