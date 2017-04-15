var inquirer = require("inquirer");
var mysql = require("mysql");
var fs = require("fs");

var connection=null;
var bamazonItems=null;
var bamazonIds=null;

fs.readFile("mysql_info.json", "utf8", function(err, data){
  if(err)
    return console.log(err);

  sqlConnect(JSON.parse(data));
});

function sqlConnect(data){
  connection=mysql.createConnection(data);

  connection.connect(function(err) {
    if (err) 
      return console.log(err);
    console.log("Connected to DB");
    startProgram();
  });
}

function startProgram(){
  sqlGetItems();
}

function sqlGetItems(){
  connection.query("select * from product", function(err, results, fields){
    if(err)
      return console.log(err);

    displayItems(err, results, fields);
    inquiAskCustomer();
  });
}

function displayItems(err, results, fields){
  bamazonItems=results;
  bamazonIds=[];

  for(var i=0; i<results.length; ++i){
    var str="Id: "+results[i].item_id+", Price: $"+results[i].price+", Product: "+results[i].product_name;
    console.log(str);

    bamazonIds.push(results[i].item_id);
  }
}

function inquiAskCustomer(){
  var questions = [
    {
      name: "id",
      message: "ID of product you would like to order? (Enter 0 to cancel)",
      type: "input",
      validate: function(input) {
        if(!bamazonIds.includes(Number(input)) && input!=='0')
          return "Item ID not found";
        else 
          return true;
      }
    },
    {
      name: "quant",
      message: "Number to order? (Enter 0 to cancel)",
      type: "input",
      validate: function(input){
        if(isNaN(input))
          return "You need to enter in a number";
        else if(Number(input)%1!==0)
          return "Please enter in an intenger";
        else if(Number(input)<0)
          return "Please enter in a positive number";
        else 
          return true;
      },
      when: function(answers){
        return answers.id!=='0';
      }
    }
  ];

  inquirer.prompt(questions).then(function(answers){
    var index=-1;

    for(var i=0; i<bamazonItems.length; ++i)
      if(bamazonItems[i].item_id==answers.id)
        index=i;

    if(answers.id==0 || answers.quant==0){
      connection.end();
      return console.log("Canceling order");
    } else if(index===-1) {
      connection.end();
      return console.log("ID not found, canceling order");
    } else if(bamazonItems[index].stock_quantity<answers.quant) {
      connection.end();
      return console.log("We are outm sorry bro");
    }
    
    orderItem(index, answers.quant);
  });
}

function orderItem(index, quant){
  //console.log(bamazonItems[index]);
  //console.log("Quant: "+quant);

  var newQuant = bamazonItems[index].stock_quantity-quant;
  var id = bamazonItems[index].item_id;

  //var query = "UPDATE product SET stock_quantity="+newQuant+" WHERE item_id="+id;

  // var sql = "UPATE product SET ? WHERE ?";
  // var inserts = [{"stock_quantity":newQuant}, {"item_id": id}];
  // sql = mysql.format(sql, inserts);
  // console.log(sql);

  var sql = "UPDATE product SET ? WHERE ?";
  var inserts = [{"stock_quantity":newQuant}, {"item_id": id}];
  sql = mysql.format(sql, inserts);
  //console.log(sql);

  connection.query(sql, function(err){
    if(err)
      return console.log(err);
  });

  console.log("Order placed!");
  connection.end();
  console.log("Connection to DB closed");
}