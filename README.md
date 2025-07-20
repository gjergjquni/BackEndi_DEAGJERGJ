# Elioti - Backend API

Platforma financiare për menaxhimin e buxhetit personal në Shqipëri.

## Përshkrimi

Elioti është një aplikacion backend që ofron API për menaxhimin e financave personale, duke përfshirë:
- Regjistrimin dhe autentifikimin e përdoruesve
- Menaxhimin e transaksioneve (të ardhura dhe shpenzime)
- Gjenerimin e raporteve financiare
- Menaxhimin e profilit të përdoruesit

## Karakteristikat

### 🔐 Autentifikim dhe Siguri
- Regjistrim i sigurt me validim të të dhënave
- Login me sesione të sigurta
- Hashimi i fjalëkalimeve me bcrypt
- Middleware për mbrojtjen e rrugëve

### 💰 Menaxhimi i Transaksioneve
- Shtimi i transaksioneve të ardhura/shpenzime
- Kategorizimi i transaksioneve
- Validimi i të dhënave

### 📊 Raportimi
- Analiza e shpenzimeve sipas kategorive
- Raporti të ardhura vs shpenzime
- Rritja e kursimeve në kohë
- Krahasimi buxheti vs aktual

### 👤 Profili i Përdoruesit
- Menaxhimi i informacionit personal
- Statusi i punësimit
- Qëllimet e kursimit

## Instalimi

1. Klononi repository-n:
```bash
git clone <repository-url>
cd Elioti
```

2. Instaloni varësitë:
```bash
npm install
```

3. Konfiguroni variablat e mjedisit (opsional):
```bash
# Krijoni një file .env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

4. Startoni serverin:
```bash
# Për development
npm run dev

# Për production
npm start
```

## API Endpoints

### Autentifikim
- `POST /signup` - Regjistrimi i përdoruesit të ri
- `POST /login` - Kyçja e përdoruesit
- `POST /logout` - Dilja e përdoruesit

### Profili
- `GET /user/profile` - Marrja e profilit të përdoruesit
- `POST /profile` - Përditësimi i profilit

### Transaksionet
- `POST /transaction` - Shtimi i transaksionit të ri
- `GET /reports/:email` - Marrja e raporteve financiare

### Konfigurimi
- `GET /categories` - Marrja e kategorive të transaksioneve
- `GET /employment-statuses` - Marrja e statusit të punësimit

## Struktura e Projektit

```
Elioti/
├── Login.js              # Serveri kryesor dhe endpoints
├── Transaction.js        # Klasat për transaksionet dhe raportet
├── UserProfile.js        # Klasa e profilit të përdoruesit
├── sessionManager.js     # Menaxhimi i sesioneve
├── authMiddleware.js     # Middleware për autentifikim
├── validators.js         # Validimi i të dhënave
├── errorHandler.js       # Menaxhimi i gabimeve
├── config.js            # Konfigurimi i aplikacionit
├── package.json         # Varësitë e projektit
└── README.md           # Dokumentimi
```

## Validimi i Të Dhënave

Aplikacioni përdor validim të rreptë për të gjitha të dhënat hyrëse:

- **Email**: Format i vlefshëm email
- **Fjalëkalim**: Të paktën 8 karaktere, 1 shkronjë e madhe, 1 numër
- **Emri**: 2-50 karaktere
- **Data e lindjes**: Moshë mes 13-100 vjeç
- **Transaksionet**: Shuma pozitive, kategoria e detyrueshme

## Menaxhimi i Gabimeve

Aplikacioni përdor një sistem të centralizuar për menaxhimin e gabimeve:

- Gabimet e validimit (400)
- Gabimet e autentifikimit (401)
- Gabimet e autorizimit (403)
- Gabimet e gjetjes (404)
- Gabimet e konfliktit (409)
- Gabimet e brendshme (500)

## Siguria

- Hashimi i fjalëkalimeve me bcrypt
- Sesione të sigurta me timeout
- Validimi i të dhënave hyrëse
- Middleware për mbrojtjen e rrugëve
- Logging i gabimeve

## Zhvillimi i Ardhshëm

- [ ] Integrimi me database (PostgreSQL/MongoDB)
- [ ] JWT tokens për autentifikim
- [ ] Rate limiting
- [ ] API documentation me Swagger
- [ ] Testet automatike
- [ ] Docker containerization
- [ ] Monitoring dhe logging i avancuar

## Kontributi

1. Fork repository-n
2. Krijoni një branch të ri (`git checkout -b feature/amazing-feature`)
3. Commit ndryshimet (`git commit -m 'Add amazing feature'`)
4. Push në branch (`git push origin feature/amazing-feature`)
5. Hapni një Pull Request

## Licenca

Ky projekt është i licencuar nën MIT License - shih file-in [LICENSE](LICENSE) për detaje.

## Kontakti

Për pyetje dhe mbështetje, kontaktoni ekipin e Elioti. 