# Guide d'Intégration Google Sheets

Ce document détaille la procédure pour connecter le formulaire d'inscription en ligne directement à un tableau de bord Google Sheets, permettant ainsi d'agréger toutes les soumissions en temps réel de manière gratuite et sécurisée.

---

## Étape 1 : Préparation du Google Sheet

1. Créez un nouveau document **Google Sheets**.
2. Sur la première ligne (les en-têtes), écrivez exactement les noms des colonnes suivants (respectez la casse) :
   - Colonne A : `Date`
   - Colonne B : `firstname`
   - Colonne C : `lastname`
   - Colonne D : `nickname`

---

## Étape 2 : Création du script d'API Google Apps Script

1. Dans votre Google Sheet, allez dans le menu supérieur : **Extensions > Apps Script**.
2. Supprimez tout code existant et collez le script suivant :

```javascript
const spreadsheetId = 'VOTRE_ID_DE_GOOGLE_SHEET_ICI'; // L'identifiant long dans l'URL de votre Google Sheet
const sheetName = 'Feuille 1'; // Remplacez par le nom exact de votre onglet si différent

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Évite les collisions d'écritures simultanées

  try {
    const doc = SpreadsheetApp.openById(spreadsheetId);
    const sheet = doc.getSheetByName(sheetName);
    
    // Lecture des en-têtes pour faire correspondre les données reçues
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;
    
    const data = JSON.parse(e.postData.contents);
    
    // Mappage des en-têtes avec les données JSON reçues
    const newRow = headers.map(header => {
      if (header === 'Date') {
        return new Date();
      }
      return data[header] || "";
    });
    
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Remplissez la variable `spreadsheetId` avec l'identifiant de votre feuille (voir explication ci-dessous).
4. Cliquez sur l'icône de **Disquette** (Enregistrer le projet).

---

## Étape 3 : Déploiement en tant qu'application Web

1. En haut à droite, cliquez sur **Déployer > Nouveau déploiement**.
2. Cliquez sur l'engrenage (Type de déploiement) et sélectionnez **Application Web**.
3. Saisissez une description (ex : "API Inscriptions Mémoire").
4. Configurez les options comme suit :
   - **Exécuter en tant que** : **Moi** (votre compte Google).
   - **Qui a accès** : **Tout le monde** (nécessaire pour que le site web public puisse soumettre les données sans s'authentifier).
5. Cliquez sur **Déployer**.
6. Autorisez les accès si nécessaire.
7. **Copiez l'URL de l'application Web** générée (se terminant par `/exec`).

> [!IMPORTANT]
> Chaque fois que vous modifiez le code Apps Script à l'avenir, vous devez créer un **nouveau déploiement** ou modifier le déploiement existant avec une **nouvelle version** pour que les changements soient appliqués en ligne.

---

## Étape 4 : Connexion dans `app.js`

Dans [app.js](file:///home/Tresorkas/Documents/sitememoire/app.js), au niveau de la soumission du formulaire, remplacez la section correspondante par le code suivant pour envoyer les données au Sheet en tâche de fond (le code ci-dessous conserve également la copie dans le LocalStorage de secours) :

```javascript
    // Remplacer l'URL ci-dessous par celle copiée à l'étape 3
    const GOOGLE_SHEET_URL = "VOTRE_URL_APPLICATIONS_SCRIPT_ICI";

    // Envoi asynchrone vers le Google Sheet
    fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newEntry)
    })
    .then(response => response.json())
    .then(result => {
      console.log("Données enregistrées sur Google Sheets avec succès !", result);
    })
    .catch(error => {
      console.error("Erreur lors de l'envoi vers Google Sheets, sauvegarde locale de secours active.", error);
    });
```
