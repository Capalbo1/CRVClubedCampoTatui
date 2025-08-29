# institucional/views.py
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import reverse
from django.template.loader import render_to_string
from django.template import TemplateDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.http import JsonResponse

from .forms import ContactForm


def inicio(request):
    # templates/institucional/inicio.html
    return render(request, "institucional/inicio.html")


def estrutura(request):
    # templates/institucional/estrutura.html
    return render(request, "institucional/estrutura.html")


def institucional(request):
    # templates/institucional/institucional.html
    return render(request, "institucional/institucional.html")


def enviar_contato(request):
    """
    Recebe o POST do formulário (Home #contato), valida e envia e-mail.
    Em requisições AJAX: retorna JSON (sem recarregar).
    Em requisições normais: usa messages + redirect(#contato).
    """
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

    if request.method != "POST":
        if is_ajax:
            return JsonResponse({"ok": False, "message": "Método não permitido."}, status=405)
        return redirect(reverse("inicio") + "#contato")

    form = ContactForm(request.POST or None)
    if not form.is_valid():
        if is_ajax:
            return JsonResponse(
                {"ok": False, "message": "Não foi possível enviar. Verifique os campos.", "errors": form.errors},
                status=400,
            )
        messages.error(request, "Não foi possível enviar. Verifique os campos e tente novamente.")
        return redirect(reverse("inicio") + "#contato")

    data = form.cleaned_data

    # Assunto (do form ou padrão)
    subject = (data.get("assunto") or "Nova mensagem pelo site").strip()

    # Destinatário (ordem: CONTACT_EMAIL > CONTACT_TO_EMAIL > DEFAULT_FROM_EMAIL > dev)
    to_email = (
        getattr(settings, "CONTACT_EMAIL", None)
        or getattr(settings, "CONTACT_TO_EMAIL", None)
        or getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or "dev@localhost"
    )

    # Contexto para templates
    ctx = {
        "site_name": getattr(settings, "SITE_NAME", "Site"),
        "nome": data.get("nome") or "",
        "email": data.get("email") or "",
        "telefone": data.get("telefone") or "",
        "mensagem": data.get("mensagem") or "",
        "assunto": subject,
    }

    # Texto puro (tenta template; se não existir, usa fallback)
    try:
        body_txt = render_to_string("email/contato.txt", ctx)
    except TemplateDoesNotExist:
        body_txt = (
            f"Mensagem enviada pelo site {ctx['site_name']}\n\n"
            f"Nome: {ctx['nome']}\n"
            f"Telefone: {ctx['telefone']}\n"
            f"E-mail: {ctx['email']}\n"
            f"Assunto: {ctx['assunto']}\n\n"
            f"Mensagem:\n{ctx['mensagem']}\n"
        )

    # HTML (tenta caminhos comuns; se não achar, usa fallback mínimo)
    try:
        body_html = render_to_string("email/contato.html", ctx)
    except TemplateDoesNotExist:
        try:
            body_html = render_to_string("contato.html", ctx)
        except TemplateDoesNotExist:
            try:
                body_html = render_to_string("institucional/contato.html", ctx)
            except TemplateDoesNotExist:
                body_html = (
                    f"<h2>Nova mensagem pelo site {ctx['site_name']}</h2>"
                    f"<p><strong>Nome:</strong> {ctx['nome']}<br>"
                    f"<strong>Telefone:</strong> {ctx['telefone']}<br>"
                    f"<strong>E-mail:</strong> {ctx['email']}<br>"
                    f"<strong>Assunto:</strong> {ctx['assunto']}</p>"
                    f"<hr><div style='white-space:pre-wrap'>{ctx['mensagem']}</div>"
                )

    # Envio com EmailMultiAlternatives (permite HTML)
    email_kwargs = {
        "subject": subject,
        "body": body_txt,  # texto puro
        "from_email": getattr(settings, "DEFAULT_FROM_EMAIL", None),
        "to": [to_email],
    }
    if data.get("email"):
        email_kwargs["reply_to"] = [data["email"]]  # responder direto ao usuário

    msg = EmailMultiAlternatives(**email_kwargs)
    msg.attach_alternative(body_html, "text/html")
    msg.send(fail_silently=False)

    if is_ajax:
        return JsonResponse({"ok": True, "message": "Mensagem enviada com sucesso!"})

    messages.success(request, "Mensagem enviada com sucesso!")
    return redirect(reverse("inicio") + "#contato")
