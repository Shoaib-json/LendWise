// router/mainroutes.ts
import { Router } from "express";
import { HomeController, BorrowerController, InvestorController, BankController } from "../controller/controller";
import auth from "../utils/middleware";
import multer from "multer";
import { storage } from "../cloudconfig";

const router = Router();
const upload = multer({ storage });

// Home routes
router.get("/", HomeController.renderHelp);
router.get("/form",auth , HomeController.renderForm);
router.get("/home", HomeController.renderHome);
router.get("/work", HomeController.renderWork);
router.get("/about", HomeController.renderAbout);
router.get("/contact", HomeController.renderContact);
router.post("/contact" , HomeController.getContact)
router.get("/privacy", HomeController.renderPrivacy);

// Borrower routes
const uploadFields = upload.fields([
  { name: "proof", maxCount: 1 },
  { name: "nominee_proof", maxCount: 1 }
]);

router.post("/", auth, uploadFields, BorrowerController.createBorrower);
router.get("/dashboard", auth, BorrowerController.getDashboard);

// Investor routes
router.get("/investhelp", InvestorController.renderInvestorHelp);
router.get("/investform",auth , InvestorController.renderInvestorForm);
router.post("/investor-test", auth, InvestorController.createInvestor);

// Bank routes
router.get("/account", auth ,BankController.renderAccount);
router.post("/accountdetail", auth, BankController.createBankDetails);


export default router;