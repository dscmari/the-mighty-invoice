import { use, useEffect, useState } from "react";

interface InvoicePosition {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CompanyInfo {
  name: string;
  owner:string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  iban: string;
  bic: string;
  taxId: string;
  vatId?: string; // Optional, as you might not always have it
  country?: string; // Optional, added for consistency with customer country
}

// This interface combines all data needed for the invoice template
export interface InvoiceTemplateData {
  customerName: string;
  customerStreet: string;
  customerZip: string;
  customerCity: string;
  customerCountry: string;
  invoiceDate: string;
  dueDate: string;
  positions: InvoicePosition[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  taxRate: number; // Also pass the tax rate for display
  companyInfo: CompanyInfo; // Your static company info
  invoiceNumber: number;
}

export const generateInvoiceHtml = (data: InvoiceTemplateData): string => {
     

  const getInvoiceNumber = () => {
     const localStorageInvoiceNumber =localStorage.getItem("invoiceNr")
     if(localStorageInvoiceNumber ){
         const currentNumber = parseInt(localStorageInvoiceNumber)
         return currentNumber
     } else {
         alert("Keine Rechnungsnummer im Localstorage, siehe letzte Rechnung und aktualisiere manuell")
     }
   }  

  const positionsHtml = data.positions.map((pos, index) => `
    <tr>
      <td class="text-right">${index + 1}</td>
      <td class="text-right">${pos.description}</td>
      <td class="text-right">${pos.quantity}</td>
      <td class="text-right">${pos.unitPrice.toFixed(2)} €</td>
      <td class="text-right">${pos.total.toFixed(2)} €</td>
    </tr>
  `).join('');

  // The complete HTML content for your invoice
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rechnung - ${data.invoiceNumber}</title>
        <style>
            body {
                font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
                margin: 0;
                padding: 2cm;
                line-height: 1.6;
                color: #333;
                background-color: #f9f9f9;
                font-size: 10pt;
            }

            .container {
                max-width: 21cm; /* A4 width */
                margin: 0 auto;
                background-color: #fff;
                padding: 2cm;
                border: 1px solid #eee;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
            }

            .header h1 {
                color: #333;
                font-size: 24pt;
                margin: 0;
                line-height: 1;
            }

            .company-info {
                text-align: right;
                font-size: 9pt;
            }

            .company-info p {
                margin: 0;
            }

            .address-block {
                margin-bottom: 30px;
                padding: 15px;
                border: 1px solid #eee;
                background-color: #fcfcfc;
                border-radius: 4px;
            }

            .address-block p {
                margin: 0;
            }

            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                font-size: 10pt;
            }

            .invoice-details div p {
                margin: 0;
            }

            .invoice-details .left-details {
                flex-grow: 1;
            }

            .invoice-details .right-details {
                text-align: right;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                margin-bottom: 30px;
            }

            th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
                font-size: 9pt;
            }

            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }

            .text-right {
                text-align: right;
            }

            .text-center {
                text-align: center;
            }

            .totals-table {
                width: 40%; /* Adjust as needed */
                margin-left: auto; /* Aligns to the right */
                border-collapse: collapse;
                margin-top: 20px;
            }

            .totals-table th, .totals-table td {
                border: none;
                padding: 5px 10px;
                text-align: right;
            }

            .totals-table tr.subtotal td,
            .totals-table tr.vat td {
                border-bottom: 1px solid #eee;
            }

            .totals-table tr.total th,
            .totals-table tr.total td {
                font-size: 11pt;
                font-weight: bold;
                border-top: 2px solid #333;
                padding-top: 10px;
            }

            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 8pt;
                color: #777;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }

            .bank-details p {
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    <h1>Rechnung</h1>
                </div>
                <div class="company-info">
                    <p><strong>${data.companyInfo.name}</strong></p>
                    <p>${data.companyInfo.owner}</p>
                    <p>${data.companyInfo.street}</p>
                    <p>${data.companyInfo.zip} ${data.companyInfo.city}</p>
                    <p>${data.companyInfo.country || 'Deutschland'}</p>
                    <p>Telefon: ${data.companyInfo.phone}</p>
                    <p>E-Mail: ${data.companyInfo.email}</p>
                </div>
            </div>

            <div class="address-block">
                <p><strong>Rechnung an:</strong></p>
                <p>${data.customerName}</p>
                <p>${data.customerStreet}</p>
                <p>${data.customerZip} ${data.customerCity}</p>
                <p>${data.customerCountry}</p>
            </div>

            <div class="invoice-details">
                <div class="left-details">
                    <p><strong>Rechnungsnummer:</strong> ${data.invoiceNumber}</p>
                </div>
                <div class="right-details">
                    <p><strong>Rechnungsdatum:</strong> ${data.invoiceDate}</p>
                    <p><strong>Fälligkeitsdatum:</strong> ${data.dueDate}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Beschreibung</th>
                        <th class="text-right">Menge</th>
                        <th class="text-right">Einzelpreis</th>
                        <th class="text-right">Gesamt</th>
                    </tr>
                </thead>
                <tbody>
                    ${positionsHtml}
                </tbody>
            </table>

            <table class="totals-table">
                <tr class="subtotal">
                    <th>Netto Gesamt:</th>
                    <td>${data.subtotal.toFixed(2)} €</td>
                </tr>
                <tr class="vat">
                    <th>${(data.taxRate * 100).toFixed(0)}% Mehrwertsteuer:</th>
                    <td>${data.taxAmount.toFixed(2)} €</td>
                </tr>
                <tr class="total">
                    <th>Gesamtbetrag:</th>
                    <td>${data.grandTotal.toFixed(2)} €</td>
                </tr>
            </table>

            <div class="footer">
                <p>Vielen Dank für Ihren Auftrag! Wir freuen uns auf die weitere Zusammenarbeit.</p>
                <p>Bitte überweisen Sie den Betrag bis zum ${data.dueDate} auf folgendes Konto:</p>
                <div class="bank-details">
                    <p><strong>Bank:</strong> ${data.companyInfo.bankName}</p>
                    <p><strong>IBAN:</strong> ${data.companyInfo.iban}</p>
                    <p><strong>BIC:</strong> ${data.companyInfo.bic}</p>
                </div>
                <p>Steuernummer: ${data.companyInfo.taxId} ${data.companyInfo.vatId ? '| USt-IdNr.: ' + data.companyInfo.vatId : ''}</p>
                <p>${data.companyInfo.website}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};