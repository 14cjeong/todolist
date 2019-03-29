//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//for all mongoose methods, simply check documentation
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



//This was the original way we stored our information
//But, now we will move to storing our data in a database
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//database with mongoose
mongoose.connect("URL Not Shown", {useNewUrlParser: true});


//build schema to use with mongoose
const itemsSchema = {
  name: String
};
//model to use with mongoose. Very similar to java object creation
const Item = mongoose.model("Item", itemsSchema);
//Create new mongoose documents (basically objects based on model class)
const item1 = new Item({
  name: "Welcome to your To Do List!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
//Now, putting our default items into an array
const defaultItems = [item1, item2, item3];
//Order of creation
//Schema -> Model -> Documents
//New schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  //calling mongoose find method
  //Notice the syntax Item.find(). It's exactly like java
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      //Inserting array into items collection.
          //But only if it's empty
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      //remember that list refers to list.ejs
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});





app.post("/", function(req, res){

  const itemName = req.body.newItem;
  //following created after adding value to list.ejs
//line 24 (in the list.ejs file)
//Also remembering that the word after body
//is the name of the button...
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      //the items part taps into [itemsSchema] array
          //we're pushing in the new item that we created in line 90
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
      //A quick explanation on what's going on here:
      //No matter which list we're in, when a user tries
      //to add an input into the text field and then press the
      //submit button (as coded in list.ejs), the form on the browswer
      //will make a post request that's handled through the root route
      //(as specified by "/" in line 22 in list.ejs).
      //The server will then receive the post request and process
      //it via whatever is in app.post("/", ...). Everything
      //in this app.post method will run, including the
      // if-else statement starting on line 94.
      //If the list is already today, it will simply save, and redirect
      //the browser to the home root.
      //if not, it will initiate the else statement, which
      //ultimately redirects the page to the new custom list with the
      //following item added.
    });
  }
});




app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  //if-else statement to differentiate deleting from
  //the today list or a custom list
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //This looks very complicated
    //the $pull is a mongoDB operator
    //It's looking into the items array
    //whose elements are defined by their _id
    //whose values will be checkedItemId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
    //Also, for the above code.
    //the function is referred to as the callback
    //we're also entering a second parameter, foundList, because when we call
    //findOneAndUpdate, the findOne corresponds to finding a list
  }

  // //Mongoose method to remove
  // Item.findByIdAndRemove(checkedItemId, function(err) {
  //   if (!err) {
  //     console.log("Successfully deleted checked item.");
  //     //The deletion won't be apparent on the webpage
  //     //until we redirect to the homepage.
  //     res.redirect("/");
  //   }
  // })
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  //The purpose of this is to make sure that we don't create
  //list duplicates
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        //So, I learned that the reason my to do list
        //was working without the following code
        //was because I was manually redirecting my entering
        //the url in twice
        //this will do it automatically.
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});
app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
//Notice the addition of that callback function
app.listen(port, function(){
  console.log("Server has started successfully!")
});


//It's important to note that all of the code here
//is SERVER logic.
//All the front-end requests are in the ejs/html files, which
//would be done on a browser. I know it's confusing to think like this
//because both the client and server is being used on the same computer.
//But, imagine that the two are separate and far away.
//Through the browser, a get/post request is made to whatever
//route ("/", ""/about", etc) and everything is processed as
//coded within that specific code block. It will usually change
//what's going to appear on the broswer(aka on the client computer)
//through methods such as res.render, res.redirect, etc.
