
import React from "react";
import { ArrowLeft, Camera, Image as ImageIcon, Settings, AlertCircle, CheckCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function PermissionsHelp() {
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
            <h1 className="text-lg font-semibold text-gray-900">Ajuda com Permissões</h1>
            <p className="text-xs text-gray-500">Como ativar câmera e galeria</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
        {/* Intro */}
        <Card className="border-2 border-[#FF6B35]">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-12 h-12 text-[#FF6B35] flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Permissões Necessárias
                </h2>
                <p className="text-gray-600 text-sm">
                  Para registrar seus treinos e compartilhar progresso, o FitSwap 
                  precisa de acesso à sua câmera e galeria. Você controla quando 
                  e como concedemos essas permissões.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why We Need */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Por Que Precisamos?</h3>
          
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-[#FF6B35]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Câmera</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Tirar fotos de comprovante de treino</li>
                      <li>✓ Registrar progresso físico (antes/depois)</li>
                      <li>✓ Criar stories do seu dia de treino</li>
                      <li>✓ Comprovar participação em desafios</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Galeria de Fotos</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Selecionar fotos existentes de treinos</li>
                      <li>✓ Fazer upload de imagens do seu progresso</li>
                      <li>✓ Compartilhar conquistas anteriores</li>
                      <li>✓ Editar perfil com suas fotos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Enable - Android */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Como Ativar no Android
          </h3>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Smartphone className="w-6 h-6 text-green-600" />
                <h4 className="font-semibold text-gray-900">Android 13 ou Superior</h4>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">1</div>
                    <span className="font-semibold">Abra as Configurações do Android</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Encontre o ícone de engrenagem ⚙️ na tela inicial ou gaveta de apps
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">2</div>
                    <span className="font-semibold">Vá para "Apps" ou "Aplicativos"</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Encontre a seção que lista todos os apps instalados
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">3</div>
                    <span className="font-semibold">Encontre "FitSwap" ou seu navegador</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Role a lista e toque no FitSwap (ou Chrome/Firefox se usar pelo navegador)
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">4</div>
                    <span className="font-semibold">Toque em "Permissões"</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Você verá uma lista de todas as permissões do app
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">5</div>
                    <span className="font-semibold">Ative "Câmera" e "Fotos e vídeos"</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Toque em cada permissão e selecione "Permitir" ou "Apenas durante o uso"
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                  <div className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">
                      <strong>Pronto!</strong> Agora você pode usar câmera e galeria no FitSwap
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How to Enable - iOS */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Como Ativar no iOS (iPhone)
          </h3>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Smartphone className="w-6 h-6 text-gray-800" />
                <h4 className="font-semibold text-gray-900">iOS 13 ou Superior</h4>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">1</div>
                    <span className="font-semibold">Abra "Ajustes" (Settings)</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Toque no ícone de engrenagem na tela inicial
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">2</div>
                    <span className="font-semibold">Role para baixo até "Privacidade"</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Em versões mais recentes pode estar como "Privacidade e Segurança"
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">3</div>
                    <span className="font-semibold">Toque em "Câmera"</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Você verá uma lista de apps que solicitaram acesso à câmera
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">4</div>
                    <span className="font-semibold">Ative o Safari ou FitSwap</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Mova o botão para a direita (verde) para permitir
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-xs font-bold">5</div>
                    <span className="font-semibold">Repita para "Fotos"</span>
                  </div>
                  <p className="text-gray-600 ml-8">
                    Volte e entre em "Fotos", depois ative o app
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                  <div className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">
                      <strong>Pronto!</strong> As permissões estão ativadas no iPhone
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Troubleshooting */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Problemas Comuns</h3>

          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  📷 Câmera abre mas fica com tela preta
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Solução:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Feche completamente o app e abra novamente</li>
                  <li>• Verifique se outro app está usando a câmera</li>
                  <li>• Reinicie seu celular</li>
                  <li>• Use a opção "Galeria" como alternativa</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  🖼️ Não consigo selecionar fotos da galeria
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Solução:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Verifique se a permissão de fotos está ativada</li>
                  <li>• Limpe o cache do navegador</li>
                  <li>• Atualize para a versão mais recente do app</li>
                  <li>• Tente usar a câmera diretamente</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  ⚠️ Popup de permissão não aparece
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Solução:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Siga os passos acima para ativar manualmente</li>
                  <li>• Verifique se não bloqueou permanentemente</li>
                  <li>• Desinstale e reinstale o app (último recurso)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Privacy Note */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Settings className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  Sua Privacidade em Primeiro Lugar
                </h4>
                <p className="text-sm text-blue-800">
                  O FitSwap <strong>NUNCA</strong> acessa sua câmera ou galeria sem sua 
                  permissão explícita. Você controla quando e como usamos essas permissões. 
                  Pode revogar o acesso a qualquer momento nas configurações do dispositivo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-6 text-center">
            <h4 className="font-semibold text-gray-900 mb-2">
              Ainda com dúvidas?
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Nossa equipe de suporte está pronta para ajudar
            </p>
            <a 
              href="mailto:clebersimoessilva@gmail.com"
              className="text-[#FF6B35] font-semibold hover:underline"
            >
              clebersimoessilva@gmail.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
