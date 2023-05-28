require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//app config
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.listen(process.env.PORT || 3301, () => { console.log("App On-Line") });

const atlasDB = `${process.env.ATLASDB}/keeperDB`;
async function mongoConnect() {
    await mongoose.connect(atlasDB);
}
mongoConnect().catch(error => { console.log(error) })

const noteSchema = new mongoose.Schema({
    id: Number,
    title: String,
    content: String
});
const Note = mongoose.model("Note", noteSchema);
let noteList = [];

function queryDoc(docs, noteID) {
    let returnDoc = {
        _id: "NA",
        id: 000,
        title: "404: No matches found :(",
        content: "Try looking for a different article"
    };
    docs.map((doc) => {
        if (doc.id == noteID) {
            returnDoc = doc;
        }
    });
    return returnDoc;
}

app.get("/", (req, res) => { res.redirect("/notes") })

app.route("/notes")
    .get((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        noteList = [];
        Note.find({})
            .then(docs => {
                for (let doc of docs) {
                    noteList.push(doc);
                }
            })
            .catch(error => {
                console.log("this error in GET /notes...", error);
            })
            .finally(() => {
                const noteListJSON = JSON.stringify(noteList);
                res.write(noteListJSON.toString());
                res.send();
            });
    })
    .post((req, res) => {
        const newNote = new Note({
            id: req.body.id,
            title: req.body.title,
            content: req.body.content
        });
        newNote.save()
            .catch(error => {
                console.log("This error in POST /notes...", error);
            })
            .finally(() => {
                res.redirect("/notes");
            });
    })
    .delete((req, res) => {
        Note.deleteMany({})
            .catch(error => {
                console.log("This error in DELETE /notes...", error);
            })
            .finally(() => {
                res.redirect("/notes");
            });
    });

app.route("/notes/:noteID")
    .get((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        const noteID = req.params.noteID;
        let note = {};
        Note.find({})
            .then(docs => {
                note = queryDoc(docs, noteID);
            })
            .catch(error => {
                console.log("This error in GET /notes/:noteID...", error);
            })
            .finally(() => {
                const noteJSON = JSON.stringify(note);
                res.write(noteJSON.toString());
                res.send();
            });
    })
    .put((req, res) => {
        const noteID = req.params.noteID;
        const titleToUpdate = req.body.title;
        const contentToUpdate = req.body.content;
        let note = {};
        Note.find({})
            .then(docs => {
                note = queryDoc(docs, noteID);
            })
            .catch(error => {
                console.log("This error in PUT /notes/:noteID...", error);
            })
            .finally(() => {
                Note.findOneAndReplace({ _id: note._id }, { id: noteID, title: titleToUpdate, content: contentToUpdate }, { returnDocument: 'after' })
                    .finally(() => {
                        res.redirect(`/notes/${noteID}`);
                    });
            });
    })
    .patch((req, res) => {
        const noteID = req.params.noteID;
        const patchDoc = req.body;
        let note = {};
        Note.find({})
            .then(docs => {
                note = queryDoc(docs, noteID);
            })
            .catch(error => {
                console.log("This error in PATCH /notes/:noteID...", error);
            })
            .finally(() => {
                Note.findOneAndUpdate({ _id: note._id }, { $set: patchDoc }, { returnDocument: 'after' })
                    .finally(() => {
                        res.redirect(`/notes/${noteID}`);
                    });
            });
    })
    .delete((req, res) => {
        const noteID = req.params.noteID;
        let note = {};
        Note.find({})
            .then(docs => {
                note = queryDoc(docs, noteID);
            })
            .catch(error => {
                console.log("This error in DELETE /notes/:noteID...", error);
            })
            .finally(() => {
                Note.findOneAndDelete({ _id: note._id })
                    .catch(error => {
                        console.log('Error:...', error);
                    })
                    .finally(() => {
                        res.redirect('/notes');
                    });
            });
    });