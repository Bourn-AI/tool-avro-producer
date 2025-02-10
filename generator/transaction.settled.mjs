import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const clientId = "bourn";
const vendorId = "67976607c479e323c41f41ed";
const accountId = "4767721f-883e-4ed6-bce4-224e9a58598a";
const csvFilePath = "./example/xero-invoice-export.csv";
const transactionsData = [];
const ownerAccounts = new Map();

function getOrCreateAccount(ownerName) {
    if (!ownerAccounts.has(ownerName)) {
        const institutionName = faker.helpers.arrayElement(["Barclays", "HSBC", "Lloyds", "Natwest", "Santander"]);
        const institutionNameShort = institutionName.toUpperCase().substring(0, 4);
        const iban = `GB${institutionNameShort}${faker.string.numeric(2)}${faker.string.numeric(4)}${faker.string.numeric(14)}`;
        const bban = `${institutionNameShort}` + faker.string.numeric(14);
        ownerAccounts.set(ownerName, { iban, bban, institutionName });
    }
    return ownerAccounts.get(ownerName);
}

let balance = 0;
fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
        if (parseFloat(row.InvoiceAmountDue) > 0) {
            const accountData = getOrCreateAccount(row.ContactName);
            const counterpartData = accountData;//getOrCreateAccount(faker.person.fullName());
            balance += parseFloat(row.InvoiceAmountDue)
            
            const [day, month, year] = row.DueDate.split('/');
            const createdDate = new Date(`${year}-${month}-${day}`);
            const settledDate = new Date(createdDate.getTime() + 60 * 60 * 1000); // 1 hour later

            transactionsData.push({
                balance: parseFloat(balance.toFixed(2)),
                accountId,
                clientId,
                vendorId,
                transactionId: `txn-${faker.string.numeric(6)}`,
                status: faker.helpers.arrayElement(["settled"]),
                scheme: faker.helpers.arrayElement(["Faster Payments"]),
                endToEndTransactionId: `e2e-${faker.string.numeric(6)}`,
                amount: parseFloat(row.InvoiceAmountDue).toFixed(2),
                timestampSettled: settledDate.toISOString(),
                timestampCreated: createdDate.toISOString(),
                currencyCode: "GBP",
                debitCreditCode: faker.helpers.arrayElement(["credit"]),
                reference: row.InvoiceNumber,
                isReturn: false,
                account: {
                    iban: accountData.iban,
                    bban: accountData.bban,
                    ownerName: row.ContactName,
                    transactionOwnerName: row.ContactName,
                    institutionName: accountData.institutionName
                },
                counterpartAccount: {
                    iban: counterpartData.iban,
                    bban: counterpartData.bban,
                    ownerName: row.ContactName,
                    transactionOwnerName: row.ContactName,
                    institutionName: counterpartData.institutionName
                },
                actualEndToEndTransactionId: `actual-e2e-${faker.string.numeric(6)}`,
                directDebitMandateId: null,
                transactionCode: `T${faker.string.numeric(3)}`,
                serviceUserNumber: null,
                bacsTransactionId: null,
                bacsTransactionDescription: null,
                transactionType: faker.helpers.arrayElement(["payment"]),
                transactionSource: faker.helpers.arrayElement(["bank transfer"]),
                supplementaryData: [
                    { name: "note", value: faker.lorem.words(2) },
                    { name: "category", value: faker.helpers.arrayElement(["receipt"]) }
                ]
            });
        }
    })
    .on('end', () => {
        console.log(JSON.stringify(transactionsData, null, 2));
    });
