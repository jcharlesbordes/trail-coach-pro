# Trail Coach Pro - Déploiement Vercel

**Coach Trail Running multi-device avec synchronisation Google Drive**

---

## 📋 Avant de commencer

Tu dois avoir :
- Un compte Google (gratuit)
- 5-10 minutes

Aucune connaissance technique n'est nécessaire.

---

## 🚀 Déploiement en 3 étapes

### **Étape 1 : Préparer les fichiers (TU LE FAIS UNE FOIS)**

Tu as reçu une archive avec ces fichiers :
```
trail-coach-pro/
├── package.json
├── next.config.js
├── vercel.json
├── pages/
│   └── index.js
└── README.md (ce fichier)
```

### **Étape 2 : Créer un compte Vercel**

1. Va sur **https://vercel.com**
2. Clique **"Sign Up"** (inscris-toi)
3. Choisir "Sign up with Google" (plus rapide)
4. Autorise Vercel à accéder à Google
5. **Confirme ton email** (check ta boîte mail)

**Temps : 2 minutes**

### **Étape 3 : Déployer l'app**

**Option A : Via GitHub (recommandé si tu as GitHub)**

1. Push les fichiers sur un repo GitHub
2. Va dans Vercel → "Add New" → "Project"
3. Sélectionne ton repo
4. Clique "Deploy"
5. **Attends 1-2 minutes**
6. ✅ Ton URL est prête !

**Option B : Via ZIP (plus simple)**

1. Crée un ZIP avec tous les fichiers
2. Va sur Vercel → "Add New" → "Project"
3. Glisse-dépose le ZIP
4. Vercel détecte "Next.js"
5. Clique "Deploy"
6. **Attends 1-2 minutes**
7. ✅ Ton URL est prête !

**Option C : Vercel CLI (pour les tech-savvy)**

```bash
npm install -g vercel
vercel
```

Puis suis les instructions.

---

## ✅ C'est déployé !

Une fois le déploiement terminé, tu recevras une URL de type :

```
https://trail-coach-pro.vercel.app
```

ou 

```
https://trail-coach-pro-jean-charles.vercel.app
```

**Marque-la en favoris !** C'est ton coach trail personnel, accessible 24/7.

---

## 📱 Comment utiliser

### **Première visite**

1. Va sur ton URL
2. Clique **"Profil"** (bouton orange)
3. Remplis tes infos trail :
   - Prénom
   - Âge
   - VMA
   - Niveau (Débutant, Intermédiaire, Avancé, Ultratrail)
   - Points forts / faibles
   - Races planifiées
   - Localisation
   - Notes perso
4. Clique "Sauvegarder"

### **Poser une question**

1. Dans la zone texte : tape ta question
   - Ex: "Analyse ma course d'hier"
   - Ex: "Plan de prép pour UTMB?"
   - Ex: "Comment améliorer mes descentes?"
2. Clique "Envoyer" (ou Entrée)
3. **Le coach répond en 10-30 secondes**

### **Synchroniser entre appareils**

**Sur Desktop (après une session)** :
1. Clique bouton "Upload" (dans le panneau Sync)
2. L'app upload ton profil + conversations → Google Drive

**Sur Mobile (pour récupérer)** :
1. Va sur l'URL
2. Clique bouton "Merge"
3. L'app récupère depuis Drive + fusionne
4. **Tout est à jour !**

---

## 🔐 Données & Privacy

✅ **Tes données restent PRIVÉES** :
- **localStorage** = sur TON appareil, pas de serveur
- **Google Drive** = dans TON compte Google, personne d'autre ne voit
- **Vercel** = héberge juste le code, zéro données perso

❌ **Vercel ne stocke rien** :
- Pas tes conversations
- Pas ton profil
- Pas d'analytics personnelles

---

## 🛠️ Dépannage

### **Q: Je vois une erreur "API Anthropic"**
**R:** Tu n'as pas d'accès à l'API Claude. 
- Solution temporaire : utilise depuis Claude.ai (artifact)
- Solution long terme : obtiens une clé API (payant, ~$5/mois)

### **Q: Google Drive sync ne fonctionne pas**
**R:** Vercel peut avoir besoin d'une config. Contact support Vercel ou essaie :
1. Relancer l'app (refresh)
2. Réessayer "Upload" / "Merge"

### **Q: Mes données ont disparu!**
**R:** Pas de panique.
- Tes données sont dans localStorage du navigateur
- Essaie un autre navigateur (Chrome vs Safari)
- Télécharge ton JSON avant de changer d'ordi

### **Q: Puis-je avoir mon domaine perso?**
**R:** Oui! Après le déploiement :
1. Va dans Vercel → Ton projet
2. Settings → Domains
3. Ajoute `coach-trail.com` (si tu l'as acheté)
4. Configure les DNS
5. **Boom** → `https://coach-trail.com`

---

## 📞 Support

Si ça bloque :
1. Vérifie que tu es sur https://vercel.com
2. Recharge la page
3. Essaie incognito (cache browser)
4. Contacte Vercel support (live chat)

---

## 🎯 Prochaines étapes

Une fois déployé, tu peux :

✅ **Améliorer le coach** :
- Ajouter plus de champs au profil
- Changer le style/couleurs
- Ajouter des fonctionnalités

✅ **Sauvegarder** :
- Télécharge régulièrement ton JSON
- Mets-le dans Dropbox / Drive pour backup

✅ **Partager** (optionnel) :
- Donne l'URL à un ami coureur
- Il peut utiliser son propre profil
- Pas d'accès à TES données

---

## 🚀 C'est parti !

Tu as tout ce qu'il faut. Crée le compte Vercel et déploie en 10 min.

Bonne chance ! 🏔️🏃
