from django import forms
from email_validator import validate_email, EmailNotValidError

class ContactForm(forms.Form):
    nome = forms.CharField(max_length=120)
    telefone = forms.CharField(max_length=40, required=False)
    email = forms.EmailField()
    assunto = forms.CharField(max_length=140)
    mensagem = forms.CharField(widget=forms.Textarea)
    website = forms.CharField(required=False, widget=forms.HiddenInput)

    def clean_website(self):
        if self.cleaned_data.get("website"):
            raise forms.ValidationError("Spam detectado.")
        return ""

    def clean_email(self):
        raw = self.cleaned_data["email"]
        try:
            # Checa formato e DNS/MX (provedor real)
            v = validate_email(raw, check_deliverability=True)
            return v.email  # normalizado
        except EmailNotValidError:
            raise forms.ValidationError("E-mail inválido ou domínio sem registro MX.")
