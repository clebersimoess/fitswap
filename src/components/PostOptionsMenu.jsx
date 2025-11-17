import React, { useState } from "react";
import { Edit, Trash2, Share2, Flag, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PostOptionsMenu({ post, currentUser, onEdit, onDelete, onShare, isDeleting = false, children }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOwnPost = post.created_by === currentUser?.email;

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    await onDelete(post.id);
    // O dialog será fechado automaticamente quando a mutation for bem-sucedida
    // através do useEffect ou você pode fechar aqui após um pequeno delay
    setTimeout(() => {
      setShowDeleteDialog(false);
    }, 100);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isOwnPost && (
            <>
              <DropdownMenuItem onClick={() => onEdit(post)} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onShare('whatsapp')} className="cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar no WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onShare('twitter')} className="cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar no Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copiar link
          </DropdownMenuItem>
          {!isOwnPost && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-orange-600 focus:text-orange-600">
                <Flag className="w-4 h-4 mr-2" />
                Denunciar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O post e todas as suas fotos serão excluídos permanentemente, 
              junto com todos os comentários e curtidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Excluindo...
                </div>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}