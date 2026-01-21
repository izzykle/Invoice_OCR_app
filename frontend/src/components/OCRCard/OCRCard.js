import { useContext, useState } from "react";

import { useSnackbar } from "notistack";
import { Typography, Grid, CircularProgress } from "@mui/material";
import { useStyles } from "./styles";
import ButtonOutlined from "../StyledComponents/ButtonOutlined";
import httpRequest from "../../httpRequest";
import OCRContext from "../../context/ocr-context";
import { COLORS } from "../../styles/constants";

const OCRCard = () => {
  const classes = useStyles();
  const ocrCtx = useContext(OCRContext);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleOCRmethod = async (OCRmethod) => {
    setLoading(true);

    let formData = new FormData();
    formData.append("file", ocrCtx.actualImage);
    if (ocrCtx.file.type === "application/pdf") {
      formData.append("pdf", ocrCtx.file);
    } else if (ocrCtx.file.type === "image/jpeg") {
      formData.append("image", ocrCtx.file);
    } else if (ocrCtx.file.type === "image/png") {
      formData.append("image", ocrCtx.file);
    } else if (ocrCtx.file.type === "image/webp") {
      formData.append("image", ocrCtx.file);
    } else {
      formData.append("image", ocrCtx.file);
    }

    try {
      const startTime = performance.now();
      const resp = await httpRequest.post(`${process.env.REACT_APP_BACKEND_URL}/${OCRmethod}`, formData);
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      const time_other = duration - resp.data.time.recognition + resp.data.time.parsing;
      const time = resp["data"]["time"];
      time["other"] = time_other;
      ocrCtx.setTextResult(resp["data"]["text"]);
      const isInvoice = checkIfInvoice(resp["data"]);
      const extractedData = {
        ...resp["data"]["parsed_data"],
        id: resp["data"]["invoice_id"],
      };
      ocrCtx.setExtractedData(extractedData);
      ocrCtx.setInvoiceId(resp["data"]["invoice_id"]);
      if (isInvoice) {
        saveTimeOther(resp["data"]["invoice_id"], time_other);
      }
    } catch (error) {
      console.log("Error");
      enqueueSnackbar("Error", { variant: "error" });
    }

    setLoading(false);
    ocrCtx.setActivePage(3);
  };

  const checkIfInvoice = (data) => {
    console.log("Parsed Data:", data["parsed_data"]);
    console.log("Raw Text:", data.text);

    // Score based validation system
    let score = 0;
    const parsedData = data["parsed_data"];
    
    // Critical fields (more weight)
    if (parsedData["invoice_number"]) {
      score += 3;
      console.log("+3 for invoice_number");
    }
    if (parsedData["total_price"]) {
      score += 3;
      console.log("+3 for total_price");
    }
    if (parsedData["iban"]) {
      score += 2;
      console.log("+2 for iban");
    }
    
    // Additional supporting fields
    if (parsedData["var_symbol"]) {
      score += 1;
      console.log("+1 for var_symbol");
    }
    if (parsedData["due_date"]) {
      score += 1;
      console.log("+1 for due_date");
    }
    if (parsedData["buyer_ico"]) {
      score += 1;
      console.log("+1 for buyer_ico");
    }
    if (parsedData["supplier_ico"]) {
      score += 1;
      console.log("+1 for supplier_ico");
    }
    if (parsedData["bank"]) {
      score += 1;
      console.log("+1 for bank");
    }
    if (parsedData["swift"]) {
      score += 1;
      console.log("+1 for swift");
    }
    
    // Check for invoice-related keywords in the raw text
    const invoiceKeywords = [
      'faktúra', 'faktura', 'invoice',
      'daňový doklad', 'danovy doklad',
      'dodávateľ', 'dodavatel', 'supplier',
      'odberateľ', 'odberatel', 'customer',
      'dph', 'vat', 'ičo', 'ico'
    ];
    
    const lowerText = data.text.toLowerCase();
    for (const keyword of invoiceKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 0.5;
        console.log(`+0.5 for keyword: ${keyword}`);
      }
    }

    console.log("Final Score:", score);

    // Consider it an invoice if score is 4 or higher (lowered from 5)
    const isInvoice = score >= 4;
    ocrCtx.setIsInvoice(isInvoice);
    return isInvoice;
  };

  const saveTimeOther = async (invoice_id, time_other) => {
    try {
      await httpRequest.post(`${process.env.REACT_APP_BACKEND_URL}/save-time-other`, {
        invoice_id: invoice_id,
        time_other: time_other,
      });
    } catch (error) {
      console.log("Error");
      enqueueSnackbar("Error", { variant: "error" });
    }
  };

  return (
    <>
      <div className={classes.rootContainer}>
        <Typography variant="h5" sx={{ pt: 2 }}>
          Select OCR
        </Typography>

        <Grid container spacing={0} sx={{ mt: "15px" }}>
          <Grid item xs={6}>
            <ButtonOutlined
              onClick={() => handleOCRmethod("tesseract")}
              style={{
                padding: "6px 18px",
              }}
              disabled={loading}
            >
              Tesseract
            </ButtonOutlined>
          </Grid>
          <Grid item xs={6}>
            <ButtonOutlined
              variant="outlined"
              onClick={() => handleOCRmethod("paddleOCR")}
              style={{
                padding: "6px 18px",
              }}
              disabled={loading}
            >
              PaddleOCR
            </ButtonOutlined>
          </Grid>
        </Grid>

        {loading && <CircularProgress sx={{ color: COLORS.PRIMARY, mt: "15px" }} />}
      </div>
    </>
  );
};

export default OCRCard;
