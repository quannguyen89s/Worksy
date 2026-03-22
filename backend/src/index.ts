import app from "./server";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server is running on port 3000");
});
