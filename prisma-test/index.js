// index.js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

app.get("/", (req, res) => {
  res.json({ message: "alive" });
});

app.get("/users", async (req, res) => {

    const allUsers = await prisma.LabUser.findMany();
    res.json({
        users: allUsers
    });
});

app.get("/users/:id", async (req, res) => {

    const allUsers = await prisma.LabUser.findMany(
        {
            where: { id: Number(req.params.id) },
        }
    );
    res.json({
        users: allUsers
    });
});

app.get("/orders", async (req, res) => {

    const orders = await prisma.LabOrder.findMany();
    res.json({orders});
});

app.get("/create-user", async (req, res) => {

    const upsertUser = await prisma.LabUser.upsert({
        where: {
            id: 13227,
        },
        update: {
            UserID: "13227",
            UserName: "NEW TEST USER 13227",
        },
        create: {
            id: 13228,
            UserID: "13228",
            UserName: "NEW TEST USER 13228",
            Title: "MR",
            Possition: "IT"
        },
    })

    // const u = await prisma.LabUser.create({
    //     data: {
    //         id: 13227,
    //         UserID: 13227,
    //         UserID: "NEW TEST USER 13227",
    //         Title: "MR",
    //         Possition: "IT"
    //     },
    //   })

    res.json({upsertUser});
});

app.listen(port, () => {
  console.log(`Listening to requests on http://127.0.0.1:${port}`);
});