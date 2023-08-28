//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



const username = 'ganeshnimmala65';
//const password = 'Ganesh@123'; // Replace this with your actual password
const clusterName = 'cluster0.c9mh1we.mongodb.net';
const databaseName = 'todolistDB'; // Replace with your database name

const connectionString = `mongodb+srv://${username}:Ganesh%40123@${clusterName}/${databaseName}`;

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});


const workItems = [];

//creating the schema for items
const itemsSchema = {
  name: String
};
//creating the model for items
const Item = mongoose.model("Item",itemsSchema);
  
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);
//Retriving the elements from the database

app.get("/", function(req, res) {
  Item.find({})
    .then(foundItems => {
      if(foundItems.length ===0){
        // inserting into database
        Item.insertMany(defaultItems)
          .then(defaultItems => {
          console.log('Successfully saved items to the databse:',defaultItems);
        })
        .catch(error => {
          console.log('Error savings items:', error);
        });
        res.redirect("/");
      }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    });
});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item4 = new Item({
    name: itemName,
  });
  if(listName === "Today"){
    item4.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
    .exec()
    .then(foundList => {
      foundList.items.push(item4);
      foundList.save();
      res.redirect("/" +listName);
  })
}
});


app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(deletedItem => {
      if (!deletedItem) {
        // The item was not found, handle this case
        console.log("Item not found.");
        res.status(404).send("Item not found.");
      } else {
        console.log("Successfully deleted item from the database:", deletedItem);
        // Sending a response to the client
        res.redirect("/"); // Redirect to the home page or wherever appropriate
      }
    })
    .catch(error => {
      console.log("Error deleting item:", error);
      res.status(500).send("Error deleting item.");
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(updatedList => {
        res.redirect("/"+listName);
    })
  }
  
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
    .exec()
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
      } else {
        // Show an existing list
        console.log("found list");
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(err => {
      console.error("Error finding list:", err);
    });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
