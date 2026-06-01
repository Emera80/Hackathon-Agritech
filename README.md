# 🚜 AgriBot AI — Assistant Agricole Intelligent & RAG Full-Stack

🤖 **AgriBot AI** est un conseiller agricole intelligent conçu de bout en bout pour offrir une expertise agronomique ultra-localisée, spécifiquement adaptée aux sols et cultures en Tunisie. Alliant la puissance des modèles de langage de pointe (Google Gemini) à une architecture RAG (Retrieval-Augmented Generation) personnalisée, cette application fournit des recommandations précises, conscientes des conditions météo en temps réel et enrichies par du contenu multimédia.

---

## 🚀 Fonctionnalités Clés

- **🌾 RAG & Expertise Agronomique Tunisienne** : Système d'injection de contexte basé sur une base de connaissances locale (documents PDF, Excel, CSV) pour garantir des réponses adaptées au calendrier agricole tunisien et aux spécificités des gouvernorats.
- **🌤️ Recommandations Météo-Intelligentes** : Intégration en temps réel de l'API **OpenWeatherMap** pour adapter dynamiquement les conseils d'irrigation, de semis ou de traitement selon le climat actuel de l'utilisateur (Tunis, Sfax, Béja, etc.).
- **👁️ Vision & Analyse Multimédia** : Capacités d'analyse visuelle avancées permettant de soumettre des photos de cultures ou des vidéos de champs pour obtenir un diagnostic (détection de maladies, état des sols) via les capacités multimodales de l'IA.
- **🎙️ Accessibilité & Interaction Vocale** : Interface pensée mobile-first intégrant la reconnaissance vocale (Speech-to-Text) et la synthèse vocale (**gTTS**) pour une interaction naturelle sur le terrain.
- **📺 Intégration Tutoriels Vidéo & Images** : Recherche automatisée via les APIs YouTube et Wikimedia pour afficher instantanément des guides pratiques et des illustrations visuelles en rapport avec les conseils donnés.
- **🔐 Authentification Sécurisée** : Gestion complète des utilisateurs et des sessions de chat via des Tokens **JWT (Django SimpleJWT)**.

---

## 🛠️ Stack Technique

### 💻 Frontend (Client-Side)
- **Framework** : React JS (Vite)
- **Design / UI** : Tailwind CSS (Approche mobile-first, moderne et épurée)
- **Icônes** : Lucide React
- **Fonctionnalités natives** : API Web Speech (Reconnaissance vocale)

### ⚙️ Backend (Server-Side)
- **Framework Core** : Python, Django REST Framework (DRF)
- **Sécurité** : Django SimpleJWT (Authentification par token)
- **Moteur IA** : Google Gemini API (Modèle multimodal pour le texte et la vision)
- **Traitement de données** : RAG personnalisé (Inverted Index, Pypdf, Openpyxl)
- **Audio** : gTTS (Google Text-to-Speech)

### ☁️ Infrastructure & API Tierces
- **Base de données** : PostgreSQL / SQLite (Supporté via `dj-database-url`)
- **Données Climat** : OpenWeatherMap API
- **Recherche Vidéo** : YouTube Search Python
- **Hébergement** : Prêt pour Render (Backend) & Vercel (Frontend) & Supabase (Base de données)

---

## ⚙️ Configuration et Installation Locale

Le projet est divisé en deux répertoires distincts pour le Frontend et le Backend.

### 1. Clonage du projet
```bash
git clone https://github.com/Emera80/Hackathon-Agritech.git
cd Hackathon-Agritech
```

### 2. Configuration du Backend (Django)
```bash
# Aller dans le dossier backend
cd backend

# Créer et activer l'environnement virtuel
python -m venv env
# Sur Windows : env\Scripts\activate
# Sur Linux/Mac : source env/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer le fichier .env (à créer dans le dossier backend/)
# Variables requises :
# SECRET_KEY=votre_cle_secrete
# GEMINI_API_KEY=votre_cle_gemini
# OPENWEATHER_API_KEY=votre_cle_openweathermap
# DATABASE_URL=postgres://user:password@localhost:5432/dbname (Optionnel, utilise sqlite par défaut)

# Appliquer les migrations et lancer le serveur
python manage.py migrate
python manage.py runserver
```

### 3. Configuration du Frontend (React)
```bash
# Ouvrir un autre terminal dans le dossier agritech, puis :
cd frontend

# Installer les packages
npm install

# Configurer le fichier .env (à créer dans le dossier frontend/)
# VITE_API_URL=http://127.0.0.1:8000

# Lancer l'application en mode développement
npm run dev
```

---

## 📈 Architecture RAG (Retrieval-Augmented Generation)

Le projet utilise un moteur RAG "Light" optimisé :
- **Indexation** : Les documents (PDF, XLSX, CSV) placés dans le dossier `backend/data` sont automatiquement analysés et indexés (Index Inversé) pour une recherche rapide.
- **Cache** : Un système de cache (`rag_cache.pkl`) permet de charger instantanément la base de connaissances après la première indexation.
- **Augmentation** : Pour chaque question, le système récupère les extraits les plus pertinents et les injecte dans le prompt système de Gemini, garantissant des réponses basées sur des sources fiables et locales.

---

## 👨‍💻 Auteur

**Emera** — Étudiant en Licence Informatique
- Portefolio : [Mon Portefolio](https://mon_lien_portefolio)
- GitHub : [@Emera80](https://github.com/Emera80)
---

*Projet réalisé avec une attention particulière sur l'ergonomie (UI/UX) et l'utilité réelle pour les agriculteurs tunisiens.*
