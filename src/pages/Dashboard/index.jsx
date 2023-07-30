import React, { useState } from "react";
import {
  Button,
  AppBar,
  Toolbar,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { S3 } from "aws-sdk";
import styles from "./index.module.css";
import { toast } from "react-toastify";
import LoadingButton from "@mui/lab/LoadingButton";
import axios from "axios";

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [processingType, setProcessingType] = useState("person_tracking");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    const previewUrl = URL.createObjectURL(e.target.files[0]);
    setVideoPreviewUrl(previewUrl);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);

    const bucketName = process.env.REACT_APP_AWS_BUCKET_NAME;
    const s3 = new S3({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN,
    });

    const params = {
      Bucket: bucketName,
      Key: selectedFile.name,
      Body: selectedFile,
    };

    try {
      await s3.upload(params).promise();
      const { data } = await axios.post(`${process.env.REACT_APP_BASE_URL}/upload`, {
        bucket_name: bucketName,
        file_name: selectedFile.name,
        type: processingType,
      });
      setLoading(false);
      setSelectedFile(null);
      setVideoPreviewUrl(null);
      toast.success(data.data);
    } catch (err) {
      setLoading(false);
      setSelectedFile(null);
      setVideoPreviewUrl(null);
      toast.error(err.message);
    }
  };

  const handleProcessingTypeChange = (e) => {
    setProcessingType(e.target.value);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Video Uploader</Typography>
        </Toolbar>
      </AppBar>
      <div className={styles.root}>
        <div className={styles.uploadContainer}>
          {videoPreviewUrl ? (
            <video controls className={styles.videoPreview}>
              <source src={videoPreviewUrl} type={selectedFile.type} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className={styles.videoPreviewPlaceholder}>
              <Typography variant="subtitle1">No video selected</Typography>
            </div>
          )}
          <input
            accept="video/*"
            className={styles.input}
            id="upload-video"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="upload-video">
            <Button variant="contained" component="span">
              Select Video
            </Button>
          </label>
          <RadioGroup
            row
            aria-label="processingType"
            name="processingType"
            value={processingType}
            onChange={handleProcessingTypeChange}>
            <FormControlLabel value="person_tracking" control={<Radio />} label="Person Tracking" />
            <FormControlLabel
              value="object_detection"
              control={<Radio />}
              label="Object Detection"
            />
          </RadioGroup>
          <LoadingButton
            variant="contained"
            onClick={handleFileUpload}
            disabled={!selectedFile}
            loading={loading}>
            Upload
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
