// scripts/generate-invoice.js (or pdfGenerator.js)

// OLD: const puppeteer = require('puppeteer');
// NEW:
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// NEU: Pfad zur Datei, die die nächste Rechnungsnummer speichert
// Wenn 'nextInvoiceNumber.txt' im Projekt-Root liegt und generate-invoice.js im 'scripts'-Ordner:
const NEXT_INVOICE_NUMBER_FILE = path.join(process.cwd(), 'invoice-number.txt');
// WICHTIG: In einem ESM-Kontext kann __dirname anders sein,
// process.cwd() gibt das aktuelle Arbeitsverzeichnis des Node-Prozesses zurück,
// was oft stabiler ist, wenn du es von einem übergeordneten Skript startest (z.B. vom Server).
// Alternativ: import { fileURLToPath } from 'url'; import { dirname } from 'path';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const NEXT_INVOICE_NUMBER_FILE = path.join(__dirname, '..', 'nextInvoiceNumber.txt');
// Aber für den Anfang ist process.cwd() einfacher, wenn nextInvoiceNumber.txt wirklich im Projekt-Root liegt.


// --- HILFSFUNKTIONEN (wie zuvor, aber ohne Änderungen an import/export in diesen selbst) ---

async function getNextInvoiceNumber() {
    try {
        if (!fs.existsSync(NEXT_INVOICE_NUMBER_FILE)) {
            console.warn(`WARNUNG: Datei für Rechnungsnummer nicht gefunden (${NEXT_INVOICE_NUMBER_FILE}). Initialisiere mit 4.`);
            fs.writeFileSync(NEXT_INVOICE_NUMBER_FILE, '4', 'utf8');
            return 4;
        }
        const currentNumber = parseInt(fs.readFileSync(NEXT_INVOICE_NUMBER_FILE, 'utf8'), 10);
        if (isNaN(currentNumber)) {
            console.error(`FEHLER: Inhalt der Rechnungsnummer-Datei ist keine gültige Zahl. Setze auf 4 zurück.`);
            fs.writeFileSync(NEXT_INVOICE_NUMBER_FILE, '4', 'utf8');
            return 4;
        }
        return currentNumber;
    } catch (error) {
        console.error('FEHLER beim Lesen der Rechnungsnummer-Datei:', error);
        console.warn('Setze Rechnungsnummer auf Standardwert 4 zurück.');
        fs.writeFileSync(NEXT_INVOICE_NUMBER_FILE, '4', 'utf8');
        return 4;
    }
}

function saveNextInvoiceNumber(newNumber) {
    try {
        fs.writeFileSync(NEXT_INVOICE_NUMBER_FILE, newNumber.toString(), 'utf8');
    } catch (error) {
        console.error('FEHLER beim Speichern der Rechnungsnummer-Datei:', error);
    }
}

function formatInvoiceNumber(number, length = 3) {
    return String(number).padStart(length, '0');
}


// --- HAUPTFUNKTION FÜR PDF-GENERIERUNG ---
async function generatePdfFromTemplate(templatePath, outputFileName, data) {
    let browser;
    try {
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                htmlContent = htmlContent.replace(placeholder, data[key]);
            }
        }

        browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const downloadsPath = path.join(os.homedir(), 'Downloads');
        if (!fs.existsSync(downloadsPath)) {
            fs.mkdirSync(downloadsPath, { recursive: true });
        }

        const outputPath = path.join(downloadsPath, `${outputFileName}.pdf`);

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true
        });

        console.log(`PDF erfolgreich generiert: ${outputPath}`);
        return outputPath;

    } catch (error) {
        console.error('Fehler beim Generieren der PDF:', error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// --- NEU: Exporte der Funktionen für ES Modules ---
export {
    generatePdfFromTemplate,
    getNextInvoiceNumber,
    saveNextInvoiceNumber,
    formatInvoiceNumber
};


// --- OPTIONAL: Direkter Ausführungsblock für Tests (läuft nur, wenn das Skript direkt gestartet wird) ---
// Hier müssen wir auch auf import.meta.url statt require.main zugreifen
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        console.log("--- PDF-Generierung im Testmodus (direkter Skriptaufruf) ---");
        // Ändere den templatePath, da __dirname in ESM anders ist
        const templateFilePath = path.join(process.cwd(), 'scripts', 'invoice-template.html');

        let currentInvoiceNum = await getNextInvoiceNumber();
        const formattedInvoiceNum = formatInvoiceNumber(currentInvoiceNum);

        const invoiceData = {
            Rechnungsnummer: `INV-${formattedInvoiceNum}`,
            Rechnungsdatum: new Date().toLocaleDateString('de-DE'),
            Fälligkeitsdatum: new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString('de-DE'),
            Kundenname: "Testkunde GmbH",
            Kundenstraße: "Testweg 5",
            Kunden_PLZ: "99999",
            Kunden_Ort: "Teststadt",
            Kundenland: "Deutschland",
            Deine_Telefonnummer: "+49 111 222333",
            Deine_Email: "test@deinefirma.de",
            Deine_Bankname: "Testbank",
            Deine_IBAN: "DE12345678901234567890",
            Deine_BIC: "TESTBANKXX",
            Deine_Steuernummer: "STN 98/765/43210",
            Deine_USt_ID: "DE987654321",
            Webseite: "www.testfirma.de",
            Leistungszeitraum_Start: "01.05.2025",
            Leistungszeitraum_Ende: "31.05.2025",
        };

        const pdfFileName = `Rechnung_${invoiceData.Rechnungsnummer}`;

        const generatedFilePath = await generatePdfFromTemplate(templateFilePath, pdfFileName, invoiceData);

        if (generatedFilePath) {
            console.log(`Du findest die PDF unter: ${generatedFilePath}`);
            saveNextInvoiceNumber(currentInvoiceNum + 1);
            console.log(`Nächste Rechnungsnummer für Test auf ${currentInvoiceNum + 1} gesetzt.`);
        } else {
            console.log("Die PDF-Generierung im Testmodus ist fehlgeschlagen.");
        }
    })();
}