// GuardarButton.js
import React from "react";
import SaveIcon from '@mui/icons-material/Save';
import { Button } from "@mui/material";

const GuardarButton = ({ onClick, label = "Guardar" }) => {
  return (
    <Button
      onClick={onClick}
      variant="contained"
      style={{
        width: "230px",
        height: "38px",
          
      marginLeft: "40px", 
      marginRight: "40px",
      color: "#fff",      borderRadius: "10px",

  
      fontWeight: "100",
      alignContent: "center", 
      justifyContent: "center", 
      marginTop: "20px",
      }}
      startIcon={<SaveIcon />}
    >
    {label}
    </Button>
  );
};

export default GuardarButton;