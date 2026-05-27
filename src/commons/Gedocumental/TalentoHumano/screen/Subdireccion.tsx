import React, { useEffect } from "react";

import {

  get_hallazgos,
} from "../store/thunks/TalentoHumanoThunks.tsx";
import { useDispatch, } from "react-redux";
import { Title } from "../../../../components/Title.tsx";
import { FiltroTiposDocumentos } from "../components/FiltroTiposDocumentos.tsx";


export const SubdireccionProcesos = () => {



  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(get_hallazgos());
  }, [dispatch]);



  return (
    <>
    <div className="myContainer">
      <Title title="PROCESO DE AUDITORIA" />

      <FiltroTiposDocumentos/>
      </div>
    </>
  );
};
