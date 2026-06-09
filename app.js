import { initializeApp }
    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
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

const ADMIN_PIN = "4589";

const now = new Date();

const monthKey =
    `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;

const monthName =
    now.toLocaleString(
        'en-US',
        {
            month: 'long',
            year: 'numeric'
        }
    );

document.getElementById(
    "currentMonth"
).innerText =
    `${monthName}`;

let allStudents = [];

async function loadStudents() {

    const studentSnap =
        await getDocs(
            collection(db, "students")
        );

    allStudents = [];

    for (const docSnap of studentSnap.docs) {

        allStudents.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    }

    renderStudents(allStudents);
}

async function renderStudents(studentList) {

    let html = "";

    let total = 0;
    let paid = 0;
    let unpaid = 0;
    let totalCollection = 0;

    for (const student of studentList) {

        total++;

        const paymentQuery =
            query(
                collection(db, "payments"),
                where(
                    "studentId",
                    "==",
                    student.id
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

            paid++;
            totalCollection +=
                Number(student.fee || 0);

        } else {

            unpaid++;

        }

        html += `
<div class="student">

<h3>${student.name}</h3>

<p>Class: ${student.class}</p>

<p>Date: ${paymentDate}</p>

<p class="fee">₹${student.fee}</p>

<button
class="${status === "Paid"
                ? "paid"
                : "unpaid"
            }"
onclick="
togglePayment(
'${student.id}',
${student.fee}
)
">
${status}
</button>

</div>
`;

    }

    document.getElementById(
        "studentList"
    ).innerHTML = html;

    document.getElementById(
        "totalStudents"
    ).innerText = total;

    document.getElementById(
        "paidStudents"
    ).innerText = paid;

    document.getElementById(
        "unpaidStudents"
    ).innerText = unpaid;

    document.getElementById(
        "collection"
    ).innerText =
        "₹" + totalCollection;
}

window.togglePayment =
    async function (
        studentId,
        amount
    ) {

        const pin =
            prompt("Enter Admin PIN");

        if (pin !== ADMIN_PIN) {

            alert("Wrong PIN");

            return;
        }

        const paymentQuery =
            query(
                collection(db, "payments"),
                where(
                    "studentId",
                    "==",
                    studentId
                ),
                where(
                    "month",
                    "==",
                    monthKey
                )
            );

        const paymentSnap =
            await getDocs(paymentQuery);

        if (!paymentSnap.empty) {

            alert(
                "Already marked Paid for this month"
            );

            return;
        }

        await addDoc(
            collection(
                db,
                "payments"
            ),
            {
                studentId,
                month: monthKey,
                status: "Paid",
                amount,
                paymentDate:
                    new Date()
                        .toLocaleDateString(
                            'en-GB'
                        )
            }
        );

        loadStudents();
    };

document
    .getElementById("search")
    .addEventListener(
        "input",
        function () {

            const value =
                this.value.toLowerCase();

            const filtered =
                allStudents.filter(
                    student =>
                        student.name
                            .toLowerCase()
                            .includes(value)
                );

            renderStudents(filtered);

        }
    );

loadStudents();