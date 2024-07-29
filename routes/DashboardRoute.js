const { client } = require("../connections/db");
const checkCookie = require("../middlewares/checkCookie");
const { hashPassword } = require("../middlewares/hashPassword");
const XLSX = require("xlsx");
const router = require("express").Router();

const Months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

router.get("/", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  try {
    const orders = await client.query(
      "select * from orderdetails where purchasedate = CURRENT_DATE"
    );
    if (!orders.rowcount == 0)
      return res
        .status(404)

        .render("dashboard", { message: "No orders found", user: req.user });
    return res
      .status(200)

      .render("dashboard", { order: orders.rows, user: req.user });
  } catch (error) {
    return res.status(500).render("dashboard", {
      message: "Internal Server error",
      user: req.user,
      order: orders.rows,
    });
  }
});

router.post("/", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");

  const { productname, productquantity, customerdetails } = req.body;
  const orders = await client.query(
    "select * from orderdetails where purchasedate = CURRENT_DATE"
  );

  if (!productname || !productquantity || !customerdetails)
    return res.status(400).render("dashboard", {
      message: "Please fill all the fields",
      user: req.user,
      order: orders.rows,
    });

  try {
    const productprice = await client.query(
      `SELECT productprice FROM productprices where productname = $1`,
      [productname]
    );
    const totalprice = productquantity * productprice.rows[0].productprice;
    if (!totalprice)
      return res
        .status(400)

        .render("dashboard", {
          message: " Product not found",
          user: req.user,
          order: orders.rows,
        });

    const orderdetails = await client.query(
      `insert into orderdetails (productname, productquantity, totalprice ,customerdetails) values ($1 , $2, $3, $4)`,
      [productname, productquantity, totalprice, customerdetails]
    );

    if (orderdetails.rowCount === 0)
      return res
        .status(400)

        .render("dashboard", {
          message: "Order failed",
          user: req.user,
          order: orders.rows,
        });

    const orders = await client.query(
      "select * from orderdetails where purchasedate = CURRENT_DATE"
    );
    return res
      .status(200)

      .render("dashboard", {
        message: "Order successful",
        user: req.user,
        order: orders.rows,
      });
  } catch (error) {
    return res
      .status(500)

      .render("dashboard", {
        message: "Internal Server error",
        user: req.user,
        order: orders.rows,
      });
  }
});

router.get(
  "/deleteorder/:ordernumber",
  checkCookie("authToken"),
  async (req, res) => {
    if (!req.user) return res.status(403).redirect("/");
    const orders = await client.query(
      "select * from orderdetails where purchasedate = CURRENT_DATE"
    );

    if (!orders.rowcount == 0)
      return res
        .status(404)

        .render("dashboard", { message: "No orders found", user: req.user });

    const { ordernumber } = req.params;
    if (!ordernumber)
      return res
        .status(400)

        .render("dashboard", {
          message: "Please provide order number",
          user: req.user,
          order: orders.rows,
        });
    try {
      const orderdetails = await client.query(
        `delete from orderdetails where orderno = $1`,
        [ordernumber]
      );
      if (orderdetails.rowCount === 0)
        return res
          .status(400)

          .render("dashboard", {
            message: "Order not found ",
            user: req.user,
            order: orders.rows,
          });

      const orders = await client.query(
        "select * from orderdetails where purchasedate = CURRENT_DATE"
      );
      return res
        .status(200)

        .render("dashboard", {
          message: "Order deleted successfully ",
          user: req.user,
          order: orders.rows,
        });
    } catch (error) {
      return res.status(500).render("dashboard", {
        message: "Internal Server error",
        user: req.user,
        order: orders.rows,
      });
    }
  }
);

router.post("/editorder", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  const orders = await client.query(
    "select * from orderdetails where purchasedate = CURRENT_DATE"
  );
  if (orders.rowcount == 0)
    return res.status(404).render("dashboard", {
      message: "No orders found",
      user: req.user,
      order: orders.rows,
    });

  const { productname, productquantity, customerdetails, ordernumber } =
    req.body;
  if (!productname || !productquantity || !customerdetails || !ordernumber)
    return res.status(400).render("dashboard", {
      message: "All fields are required",
      user: req.user,
      order: orders.rows,
    });
  try {
    const productprice = await client.query(
      `SELECT productprice FROM productprices where productname = $1`,
      [productname]
    );
    const totalprice = productquantity * productprice.rows[0].productprice;
    const orderdetails = await client.query(
      `update orderdetails set productname = $1 , productquantity = $2 , totalprice = $3 , customerdetails = $4 where orderno = $5`,
      [productname, productquantity, totalprice, customerdetails, ordernumber]
    );

    if (orderdetails.rowCount == 0)
      return res.status(400).render("dashboard", {
        message: "Order not found ",
        user: req.user,
        order: orders.rows,
      });
    const order = await client.query(
      "select * from orderdetails where purchasedate = CURRENT_DATE"
    );
    return res.status(200).render("dashboard", {
      message: "Order updated successfully ",
      user: req.user,
      order: order.rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).render("dashboard", {
      message: "Internal Server error",
      user: req.user,
      order: orders.rows,
    });
  }
});

router.get("/productprices", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  try {
    const productprices = await client.query("SELECT * FROM productprices");
    if (productprices.rows.length === 0)
      return (
        res
          .status(403)
          // .json({ message: "There are no prices to show" });
          .render("changeprices", {
            user: req.user,
            message: "There are no prices to show",
          })
      );
    return (
      res
        .status(200)
        // .json({ user: req.user, prices: productprices });
        .render("productprices", {
          user: req.user,
          pricesno: productprices,
        })
    );
  } catch (error) {
    return res.status(500).render("productprices", {
      message: "Internal Server error",
      user: req.user,
    });
    // .json({ message: "Internal Server error" });
  }
});

router.post("/productprices", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  try {
    const { productname, productprice } = req.body;
    console.log(productname, productprice);
    if (!productname || !productprice)
      return res.status(400).render("productprices", {
        user: req.user,
        message: "Please fill all the fields",
      });
    const updateproductprices = await client.query(
      `UPDATE productprices SET productprice = $1 WHERE productname = $2`,
      [productprice, productname]
    );
    if (updateproductprices.rowCount === 0)
      return res.status(400).render("productprices", {
        user: req.user,
        message: "Product not found",
      });

    const productprices = await client.query("SELECT * FROM productprices");
    if (productprices.rows.length === 0)
      return res.status(403).render("productprices", {
        user: req.user,
        message: "There are no prices to show",
      });

    return res.status(200).render("productprices", {
      user: req.user,
      message: "Product updated successfully",
      pricesno: productprices,
    });
  } catch (error) {
    return res.status(500).render("productprices", {
      message: "Internal Server error",
      user: req.user,
    });
  }
});

router.get("/addnewuser", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  const allusers = await client.query(
    `SELECT username , email , permission as role FROM userdetails`
  );
  return res.render("addnewuser", { user: req.user, users: allusers.rows });
});

router.post("/addnewuser", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).render("addnewuser", {
      message: "Please fill all the fields",
      user: req.user,
    });

  const alreadyExists = await client.query(
    `SELECT email FROM userdetails WHERE email = $1`,
    [email]
  );
  let allusers = await client.query(
    `SELECT username , email , permission as role FROM userdetails`
  );
  if (alreadyExists.rows.length !== 0)
    return res.status(400).render("addnewuser", {
      message: "User already exists",
      user: req.user,
      users: allusers.rows,
    });
  const { salt, hash } = await hashPassword(password);
  const addUser = await client.query(
    `INSERT INTO userdetails (username, email, hashedpassword , salt) VALUES ($1, $2, $3, $4)`,
    [username, email, hash, salt]
  );
  let alluser = await client.query(
    `SELECT username , email , permission as role FROM userdetails`
  );
  return res.status(200).render("addnewuser", {
    message: "User added successfully",
    user: req.user,
    users: alluser.rows,
  });
});

router.get("/allorders", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  try {
    const orders = await client.query("select * from orderdetails");
    return res
      .status(200)
      .render("allorders", { order: orders.rows, user: req.user });
  } catch (error) {
    return res.status(500).render("allorders", {
      message: "Internal Server error",
      user: req.user,
    });
  }
});

router.post("/print", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).render("/");

  const { customerdetails } = req.body;
  if (!customerdetails)
    return res.status(400).render("dashboard", {
      message: "Please fill all the fields",
      user: req.user,
    });
  const orders = await client.query(
    `Select * from orderdetails where customerdetails = $1`,
    [customerdetails]
  );
  return res
    .status(200)
    .render("print", { orders: orders.rows, user: req.user });
});

router.get("/exceldownload", async (req, res) => {
  try {
    const date = new Date();
    const { rows, fields } = await client.query(`SELECT * FROM orderdetails`);
    const heading = [
      [
        "Orderno",
        "PurchaseDate",
        "ProductName",
        "ProductQuantity",
        "Total Amount",
        "Customer_Details",
      ],
    ];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.sheet_add_aoa(worksheet, heading);
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Orders-${Months[date.getMonth()]}-${date.getFullYear()}`
    );

    // XLSX.writeFile(workbook, `Orders-${date.getFullYear()}.xlsx`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Orders-${
        Months[date.getMonth()]
      }-${date.getFullYear()}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const buffer = XLSX.write(workbook, { type: "buffer" });
    res.send(buffer);
    return res.redirect("/dashboard/allorders");
  } catch (error) {
    console.log(error);
  }
});

router.get("/deleteall", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  try {
    await client.query("Delete from orderdetails");
    return res.status(200).render("allorders", {
      message: "All orders deleted successfully",
      user: req.user,
    });
  } catch (error) {}
});

router.get("/deleteuser/:email", checkCookie("authToken"), async (req, res) => {
  if (!req.user) return res.status(403).redirect("/");
  if (req.user.permission !== "admin")
    return res.status(403).redirect("/dashboard");
  try {
    const email = req.params.email;
    if (email == req.user.email)
      return res.status(403).render("addnewuser", {
        message: "You are currently Loggin so you cannot delete yourself",
        user: req.user,
        users: allusers.rows,
      });
    await client.query("Delete from userdetails Where email = $1", [email]);
    let allusers = await client.query(
      `SELECT username , email , permission as role FROM userdetails`
    );
    return res.status(200).render("addnewuser", {
      message: `${email} deleted successfully`,
      user: req.user,
      users: allusers.rows,
    });
  } catch (error) {}
});
module.exports = router;
