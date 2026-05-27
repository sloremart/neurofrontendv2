import { Box, Typography } from "@mui/material";
import React from "react";

interface Props {
  title: string;
  width?: string;
  fontSize?: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Title: React.FC<Props> = ({ title, width, fontSize }: Props) => {
  return (
    <Box
      className={`border px-4 text-white fs-5 p-1`}
      sx={{
        display: "flex",
        background:
          "transparent linear-gradient(45deg, #8E0E76 0%, #381A73 25%, #1E2E71 50%, #0F4374 75%, #08717A 100%) 0% 0% no-repeat padding-box",
        width: width || "95%", 
        marginLeft: "auto",
        marginRight: "auto",
        height: "40px",
        color: "#fff",
        borderRadius: "10px",
        paddingLeft: "10px",
        paddingRight: "10px",
        fontSize: fontSize || "17px",
        fontWeight: "900",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "20px",
      }}
    >
      <Typography
        sx={{
          fontSize: fontSize || "17px",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};
