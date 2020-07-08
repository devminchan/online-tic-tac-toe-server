import express from "express";

const router = express.Router();

router.use("/auth", (req, res) => {
  res.json({
    message: "hello",
  });
});

export default router;
