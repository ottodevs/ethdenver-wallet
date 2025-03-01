"use client";
import React, { useState } from "react";
import { OktoClient, useOkto } from "@okto_web3/react-sdk";
 
interface GetButtonProps {
    title: string;
    apiFn: (oktoClient: OktoClient) => Promise<unknown>;
}
 
const GetButton: React.FC<GetButtonProps> = ({ title, apiFn }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [resultData, setResultData] = useState("");
    const oktoClient = useOkto();
 
    const handleButtonClick = () => {
        apiFn(oktoClient)
        .then((result: unknown) => {
            console.log(`${title}:`, result);
            const resultData = JSON.stringify(result, null, 2);
            setResultData(resultData !== "null" ? resultData : "No result");
            setModalVisible(true);
        })
        .catch((error: unknown) => {
            console.error(`${title} error:`, error);
            setResultData(`error: ${error}`);
            setModalVisible(true);
        });
    };
 
    const handleClose = () => setModalVisible(false);
 
    return (
        <div className="text-center text-white">
            <button
                className="px-4 py-2 w-full bg-blue-500 text-white rounded"
                onClick={handleButtonClick}
            >
                {title}
            </button>
 
            {modalVisible && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-black rounded-lg w-11/12 max-w-2xl p-6">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="text-lg font-semibold">{title} Result</h2>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={handleClose}
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-left text-white max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-words text-white">
                                {resultData}
                            </pre>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                                onClick={handleClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
 
export default GetButton;