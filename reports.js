import { initializeApp }
    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where
}
    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBLRPhe7W9MUooaxMzqPamLJrbCdKTSqtY",
    authDomain: "student-fee-manager-v2.firebaseapp.com",
    projectId: "student-fee-manager-v2",
    storageBucket: "student-fee-manager-v2.firebasestorage.app",
    messagingSenderId: "645713472669",
    appId: "1:645713472669:web:2769769169b6a18542f874"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const reportDiv =
    document.getElementById("reportList");

const months = [];

for (let i = 0; i < 4; i++) {

    const d = new Date();

    d.setMonth(d.getMonth() - i);

    months.push({
        key:
            `${d.getFullYear()}-${String(
                d.getMonth() + 1
            ).padStart(2, "0")}`,
        name:
            d.toLocaleString(
                'en-US',
                {
                    month: 'long',
                    year: 'numeric'
                })
    });
}

reportDiv.innerHTML =
    months.map(m => `
<div class="student">
<h3>${m.name}</h3>
<button onclick="downloadReport('${m.key}','${m.name}')">
Download PDF
</button>
</div>
`).join("");

window.downloadReport =
    async function (monthKey, monthName) {

        const studentsSnap =
            await getDocs(
                collection(db, "students")
            );

        let rows = [];

        let totalStudents = 0;
        let paidStudents = 0;
        let unpaidStudents = 0;
        let expectedCollection = 0;
        let collected = 0;

        for (const studentDoc of studentsSnap.docs) {

            const student = studentDoc.data();

            totalStudents++;

            expectedCollection +=
                Number(student.fee || 0);

            const paymentQuery =
                query(
                    collection(db, "payments"),
                    where(
                        "studentId",
                        "==",
                        studentDoc.id
                    ),
                    where(
                        "month",
                        "==",
                        monthKey
                    )
                );

            const paymentSnap =
                await getDocs(paymentQuery);

            let status = "Unpaid";
            let paymentDate = "-";

            if (!paymentSnap.empty) {

                const payment =
                    paymentSnap.docs[0].data();

                status =
                    payment.status || "Paid";

                paymentDate =
                    payment.paymentDate || "-";

                paidStudents++;

                collected +=
                    Number(student.fee || 0);

            } else {

                unpaidStudents++;

            }

            rows.push([
                student.name,
                student.mobile || "-",
                monthName,
                student.fee,
                status,
                paymentDate
            ]);

        }

        const due =
            expectedCollection - collected;

        const { jsPDF } =
            window.jspdf;

        const doc = new jsPDF();

        doc.setFontSize(16);

        doc.text(
            `Fee Report - ${monthName}`,
            14,
            15
        );

        doc.autoTable({
            head: [[
                "Student",
                "Mobile",
                "Month",
                "Fee",
                "Status",
                "Payment Date"
            ]],
            body: rows,
            startY: 25
        });

        let y =
            doc.lastAutoTable.finalY + 15;

        doc.text(
            `Total Students: ${totalStudents}`,
            14,
            y
        );

        y += 8;

        doc.text(
            `Paid Students: ${paidStudents}`,
            14,
            y
        );

        y += 8;

        doc.text(
            `Unpaid Students: ${unpaidStudents}`,
            14,
            y
        );

        y += 8;

        doc.text(
            `Expected Collection: ₹${expectedCollection}`,
            14,
            y
        );

        y += 8;

        doc.text(
            `Collected: ₹${collected}`,
            14,
            y
        );

        y += 8;

        doc.text(
            `Due: ₹${due}`,
            14,
            y
        );

        doc.save(
            `${monthName}-Report.pdf`
        );

    };