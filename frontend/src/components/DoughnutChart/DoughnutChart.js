import React, { useEffect, useState } from "react";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useSnackbar } from "notistack";
import { Paper, Tooltip as MuiTooltip } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

import { useStyles } from "./styles";
import httpRequest from "../../httpRequest";

const DoughnutChart = ({ handleCloseChart, invoice_id }) => {
  const classes = useStyles();
  ChartJS.register(ArcElement, Tooltip, Legend);
  const [recognition, setRecognition] = useState(null);
  const [parsing, setParsing] = useState(null);
  const [other, setOther] = useState(null);
  const [score, setScore] = useState(null);
  const [ocrMethod, setOcrMethod] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!invoice_id) {
          console.warn("No invoice ID provided");
          enqueueSnackbar("No invoice data available", { variant: "warning" });
          return;
        }

        const resp = await httpRequest.post(
          `${process.env.REACT_APP_BACKEND_URL}/get-performance-data`,
          {
            invoice_id: invoice_id,
          },
        );

        if (resp.data && resp.data.recognition_time) {
          setRecognition(resp.data.recognition_time);
          setParsing(resp.data.parsing_time);
          setOther(resp.data.other_time);
          setScore(resp.data.average_confidence);
          setOcrMethod(resp.data.ocr_method);
        } else {
          console.warn("Invalid performance data format:", resp.data);
          enqueueSnackbar("Invalid performance data received", { variant: "warning" });
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
        enqueueSnackbar("Error fetching performance data. Try reloading the page.", { variant: "error" });
      }
    };

    if (invoice_id) {
      fetchData();
    }
  }, [invoice_id, enqueueSnackbar]);

  let data = "";
  if (recognition) {
    data = {
      labels: ["Recognizing", "Parsing", "Other"],
      datasets: [
        {
          label: "Time",
          data: [recognition, parsing, other],
          backgroundColor: [
            "rgba(255, 99, 132)",
            "rgba(54, 162, 235)",
            "rgba(255, 206, 86)",
          ],
          borderColor: ["rgba(255, 99, 132)", "rgba(54, 162, 235)", "rgba(255, 206, 86)"],
          borderWidth: 1,
        },
      ],
    };
  }

  const handleIsChartOpen = () => {
    handleCloseChart(false);
  };

  return (
    <>
      <div className={classes.center}>
        <Paper
          elevation={3}
          sx={{
            borderRadius: 10,
            textAlign: "left",
          }}
        >
          {recognition ? (
            <div className={classes.containers}>
              <div className={classes.titleContainer}>
                <IconButton onClick={handleIsChartOpen}>
                  <ArrowBackIcon sx={{ color: "black" }} />
                </IconButton>
                <h3 className={classes.title}>{ocrMethod} performance</h3>
                <MuiTooltip title="Tesseract and PaddleOCR score represents different metrics and are calculated using different methods so they cannot be directly compared based on this score.">
                  <PriorityHighIcon className={classes.icon} />
                </MuiTooltip>
              </div>
              <div className={classes.chartContainer}>
                <Doughnut data={data} />
              </div>
              {ocrMethod === "Tesseract" ? (
                <MuiTooltip title="Percentage indicating how confident the OCR engine was in the correctness of the recognized text.">
                  <p className={classes.centerScore}>{score.toFixed(2)}%</p>
                </MuiTooltip>
              ) : (
                <MuiTooltip title="Recognition score represents the probability of the recognized text being correct, calculated by the recognition model.">
                  <p className={classes.centerScore}>{score.toFixed(2)}%</p>
                </MuiTooltip>
              )}
              <p className={classes.paragraph}>
                Total invoice processing time:{" "}
                <strong>
                  {recognition && (recognition + parsing + other).toFixed(2)}s
                </strong>
              </p>
            </div>
          ) : (
            <div className={classes.containers}>
              <IconButton onClick={handleIsChartOpen}>
                <ArrowBackIcon />
              </IconButton>
              <p className={classes.centerText}>No data available!</p>
            </div>
          )}
        </Paper>
      </div>
    </>
  );
};

export default DoughnutChart;
