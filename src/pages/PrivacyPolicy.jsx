import React from "react";
import { ArrowLeft, Shield, Camera, Image as ImageIcon, Trash2, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
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
            <h1 className="text-lg font-semibold text-gray-900">Política de Privacidade</h1>
            <p className="text-xs text-gray-500">Última atualização: Novembro 2025</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] rounded-2xl p-6 text-white">
          <Shield className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sua privacidade importa</h2>
          <p className="opacity-90">
            No FitSwap, levamos a segurança dos seus dados muito a sério. 
            Esta política explica como coletamos, usamos e protegemos suas informações.
          </p>
        </div>

        {/* 1. Informações que Coletamos */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Informações que Coletamos</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">1.1. Dados de Cadastro</h4>
              <p className="text-gray-600 text-sm">
                • Nome completo<br />
                • Endereço de e-mail<br />
                • Dados de perfil (bio, foto, objetivos fitness)
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">1.2. Dados de Treino e Progresso</h4>
              <p className="text-gray-600 text-sm">
                • Registros de treinos<br />
                • Fotos de comprovante e progresso físico<br />
                • Estatísticas e métricas de performance<br />
                • Participação em desafios
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">1.3. Conteúdo Gerado pelo Usuário</h4>
              <p className="text-gray-600 text-sm">
                • Posts e stories<br />
                • Comentários e curtidas<br />
                • Mensagens em chats de instrutores
              </p>
            </div>
          </div>
        </section>

        {/* 2. Permissões do Dispositivo */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">2. Permissões do Dispositivo</h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Acesso à Câmera</h4>
                <p className="text-gray-600 text-sm">
                  <strong>Por que precisamos:</strong> Para tirar fotos de comprovantes de treino, 
                  progresso físico e criar stories.<br />
                  <strong>Quando solicitamos:</strong> Apenas quando você clicar em "Tirar Foto".<br />
                  <strong>Você pode negar:</strong> Sim, e ainda usar a galeria para fazer upload de fotos.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Acesso à Galeria</h4>
                <p className="text-gray-600 text-sm">
                  <strong>Por que precisamos:</strong> Para selecionar fotos existentes do seu 
                  progresso fitness e compartilhar treinos.<br />
                  <strong>Quando solicitamos:</strong> Apenas quando você clicar em "Escolher da Galeria".<br />
                  <strong>Você pode negar:</strong> Sim, mas não poderá fazer upload de fotos da galeria.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <strong>⚠️ Importante:</strong> Nunca acessamos suas fotos ou câmera sem sua permissão 
              explícita. Você pode revogar essas permissões a qualquer momento nas configurações do dispositivo.
            </p>
          </div>
        </section>

        {/* 3. Como Usamos Seus Dados */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">3. Como Usamos Seus Dados</h3>
          
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>✓ Fornecer e melhorar nossos serviços</li>
            <li>✓ Personalizar sua experiência fitness</li>
            <li>✓ Conectar você com outros usuários e instrutores</li>
            <li>✓ Processar pagamentos de planos e assinaturas</li>
            <li>✓ Enviar notificações sobre atividades relevantes</li>
            <li>✓ Garantir segurança e prevenir fraudes</li>
            <li>✓ Analisar estatísticas de uso (dados anonimizados)</li>
          </ul>
        </section>

        {/* 4. Compartilhamento de Dados */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">4. Compartilhamento de Dados</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>✓ Nunca vendemos seus dados pessoais a terceiros</strong>
              </p>
            </div>

            <p className="text-gray-600 text-sm">
              Compartilhamos dados apenas quando:
            </p>

            <ul className="space-y-2 text-gray-600 text-sm ml-4">
              <li>• Você autoriza explicitamente (posts públicos, perfil público)</li>
              <li>• Necessário para processar pagamentos (gateways seguros)</li>
              <li>• Exigido por lei ou ordem judicial</li>
              <li>• Para proteger direitos e segurança do FitSwap e usuários</li>
            </ul>
          </div>
        </section>

        {/* 5. Armazenamento de Dados */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">5. Armazenamento e Segurança</h3>
          
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              <strong>Onde armazenamos:</strong> Seus dados são armazenados em servidores 
              seguros na nuvem com criptografia.
            </p>
            <p>
              <strong>Por quanto tempo:</strong> Mantemos seus dados enquanto sua conta estiver 
              ativa. Após exclusão da conta, dados são removidos em até 30 dias.
            </p>
            <p>
              <strong>Segurança:</strong> Utilizamos HTTPS, criptografia de dados sensíveis, 
              autenticação segura e backups regulares.
            </p>
          </div>
        </section>

        {/* 6. Seus Direitos (LGPD) */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">6. Seus Direitos (LGPD)</h3>
          
          <p className="text-gray-600 text-sm mb-4">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Acesso aos Dados</h4>
                <p className="text-gray-600 text-sm">
                  Solicitar uma cópia de todos os dados que temos sobre você
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Trash2 className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Exclusão de Dados</h4>
                <p className="text-gray-600 text-sm">
                  Deletar sua conta e todos os dados associados permanentemente
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Correção de Dados</h4>
                <p className="text-gray-600 text-sm">
                  Atualizar ou corrigir informações incorretas
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Para exercer seus direitos:</strong> Acesse Configurações → Deletar Conta 
              ou entre em contato conosco através do email: <strong>clebersimoessilva@gmail.com</strong>
            </p>
          </div>
        </section>

        {/* 7. Menores de Idade */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">7. Uso por Menores de Idade</h3>
          
          <p className="text-gray-600 text-sm">
            O FitSwap é destinado a usuários com <strong>13 anos ou mais</strong>. 
            Não coletamos intencionalmente dados de crianças menores de 13 anos. 
            Se você acredita que coletamos dados de uma criança, entre em contato 
            conosco imediatamente para que possamos removê-los.
          </p>
        </section>

        {/* 8. Cookies e Tecnologias */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">8. Cookies e Tecnologias</h3>
          
          <p className="text-gray-600 text-sm mb-3">
            Utilizamos cookies e tecnologias similares para:
          </p>
          <ul className="space-y-1 text-gray-600 text-sm ml-4">
            <li>• Manter você logado na plataforma</li>
            <li>• Lembrar suas preferências</li>
            <li>• Analisar como você usa o app (dados anonimizados)</li>
            <li>• Melhorar desempenho e funcionalidades</li>
          </ul>
        </section>

        {/* 9. Alterações na Política */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">9. Alterações nesta Política</h3>
          
          <p className="text-gray-600 text-sm">
            Podemos atualizar esta política periodicamente. Notificaremos você sobre 
            mudanças significativas através do app ou por email. O uso continuado do 
            FitSwap após as alterações constitui aceitação da nova política.
          </p>
        </section>

        {/* 10. Contato */}
        <section className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">10. Entre em Contato</h3>
          
          <p className="text-gray-600 text-sm mb-4">
            Se você tiver dúvidas sobre esta política ou sobre como tratamos seus dados:
          </p>

          <div className="space-y-2 text-gray-700 text-sm">
            <p><strong>Email:</strong> clebersimoessilva@gmail.com</p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-6">
          <p>FitSwap © 2025 - Todos os direitos reservados</p>
          <p className="mt-2">Comprometidos com sua privacidade e segurança</p>
        </div>
      </div>
    </div>
  );
}