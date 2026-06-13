// Fatura kaydetme hata kodunu kullanıcının diline çevirir.
// new/page.tsx'ten BİREBİR çıkarıldı (davranış değişmedi).
export function saveErrorMessage(code: string | undefined, fallback: string | undefined, lang: string): string {
  const M: Record<string, Record<string, string>> = {
    item_description: { TR: "Lütfen tüm fatura kalemlerine bir açıklama girin.", EN: "Please enter a description for every line item.", DE: "Bitte gib für jede Position eine Beschreibung ein.", NL: "Voer een omschrijving in voor elke regel.", FR: "Veuillez saisir une description pour chaque ligne.", ES: "Introduce una descripción para cada línea.", IT: "Inserisci una descrizione per ogni riga." },
    item_quantity: { TR: "Miktar geçerli bir sayı olmalı.", EN: "Quantity must be a valid number.", DE: "Die Menge muss eine gültige Zahl sein.", NL: "Aantal moet een geldig getal zijn.", FR: "La quantité doit être un nombre valide.", ES: "La cantidad debe ser un número válido.", IT: "La quantità deve essere un numero valido." },
    item_price: { TR: "Fiyat negatif olamaz.", EN: "Price cannot be negative.", DE: "Der Preis darf nicht negativ sein.", NL: "Prijs mag niet negatief zijn.", FR: "Le prix ne peut pas être négatif.", ES: "El precio no puede ser negativo.", IT: "Il prezzo non può essere negativo." },
    item_vat: { TR: "KDV oranı 0–100 arasında olmalı.", EN: "VAT rate must be between 0 and 100.", DE: "Der MwSt.-Satz muss zwischen 0 und 100 liegen.", NL: "Btw-tarief moet tussen 0 en 100 liggen.", FR: "Le taux de TVA doit être compris entre 0 et 100.", ES: "El IVA debe estar entre 0 y 100.", IT: "L'IVA deve essere tra 0 e 100." },
    client_email: { TR: "Müşteri e-postası geçerli değil.", EN: "Client email is not valid.", DE: "Die Kunden-E-Mail ist ungültig.", NL: "Klant-e-mail is ongeldig.", FR: "L'e-mail du client n'est pas valide.", ES: "El correo del cliente no es válido.", IT: "L'email del cliente non è valida." },
    due_date: { TR: "Vade tarihi, fatura tarihinden önce olamaz.", EN: "Due date cannot be before the issue date.", DE: "Das Fälligkeitsdatum darf nicht vor dem Rechnungsdatum liegen.", NL: "Vervaldatum mag niet vóór de factuurdatum liggen.", FR: "L'échéance ne peut pas précéder la date de facture.", ES: "El vencimiento no puede ser anterior a la fecha de factura.", IT: "La scadenza non può precedere la data della fattura." },
    items_empty: { TR: "En az bir fatura kalemi ekleyin.", EN: "Add at least one line item.", DE: "Füge mindestens eine Position hinzu.", NL: "Voeg minstens één regel toe.", FR: "Ajoutez au moins une ligne.", ES: "Añade al menos una línea.", IT: "Aggiungi almeno una riga." },
    number: { TR: "Fatura numarası gerekli.", EN: "Invoice number is required.", DE: "Rechnungsnummer ist erforderlich.", NL: "Factuurnummer is vereist.", FR: "Le numéro de facture est requis.", ES: "El número de factura es obligatorio.", IT: "Il numero di fattura è obbligatorio." },
    invalid: { TR: "Lütfen formdaki bilgileri kontrol edin.", EN: "Please check the form fields.", DE: "Bitte überprüfe die Formularfelder.", NL: "Controleer de formuliervelden.", FR: "Veuillez vérifier les champs du formulaire.", ES: "Revisa los campos del formulario.", IT: "Controlla i campi del modulo." },
  };
  if (code && M[code]) return M[code][lang] || M[code]["EN"];
  // errorCode yoksa (DB hatası vb.) genel mesaj — yine tek dil
  const generic: Record<string, string> = { TR: "Kaydedilemedi. Lütfen tekrar deneyin.", EN: "Could not save. Please try again.", DE: "Speichern fehlgeschlagen. Bitte erneut versuchen.", NL: "Opslaan mislukt. Probeer opnieuw.", FR: "Échec de l'enregistrement. Réessayez.", ES: "No se pudo guardar. Inténtalo de nuevo.", IT: "Salvataggio non riuscito. Riprova." };
  return generic[lang] || generic["EN"];
}
