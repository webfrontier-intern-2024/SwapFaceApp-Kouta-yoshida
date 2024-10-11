"use client"; // これによりコンポーネントがクライアントコンポーネントとしてマークされます

import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@mui/material/Button'; // Material-UIのButtonコンポーネントをインポート

interface Datas {
  probability: number; // 型を修正
  x_max: number;
  y_max: number;
  x_min: number;
  y_min: number;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<Datas | null>(null);
  const [finalImageSrc, setFinalImageSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ用のステートを追加
  const maskImageSrc = "/images/kao.png"; // public/images フォルダ内にある場合
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 顔座標を取得し、マスクを描画する処理
  const getFaceCoordinates = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const apiUrl = "/api/upload";
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        if (result.box) {
          const data = result.box;
          const datas: Datas = {
            x_max: data.x_max,
            y_max: data.y_max,
            x_min: data.x_min,
            y_min: data.y_min,
            probability: data.probability || 1,
          };
          setJsonData(datas);
          setErrorMessage(null); // エラーメッセージをリセット

          // 座標をもとにマスク描画
          await drawMaskOnCanvas(datas);
        } else {
          // 顔が検出されなかった場合のエラーメッセージ
          setErrorMessage('顔が検出されませんでした。別の画像を試してください。');
        }
      } else {
        console.error('APIリクエストが失敗しました');
        setErrorMessage('APIリクエストに失敗しました。');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('顔座標の取得に失敗しました');
    }
  };

  useEffect(() => {
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [selectedFile]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [".png", ".jpeg", ".jpg"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setJsonData(null); // 新しい画像を選択したら座標データをリセット
        setFinalImageSrc(null); // 結果画像もリセット
        setErrorMessage(null); // エラーメッセージをリセット
      }
    },
  });

  const handleDeleteImage = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setJsonData(null);
    setFinalImageSrc(null); // 結果画像をリセット
    setErrorMessage(null); // エラーメッセージをリセット
  };

  // マスクを描画する処理
  const drawMaskOnCanvas = async (coords: Datas) => {
    const canvas = canvasRef.current;
    if (!canvas || !filePreview) return;

    const ctx = canvas.getContext('2d');
    const imageA = new Image();
    imageA.src = filePreview;

    const maskImage = new Image();
    maskImage.src = maskImageSrc;

    // 画像が読み込まれるのを待つ
    await new Promise((resolve) => {
      imageA.onload = resolve;
    });

    await new Promise((resolve) => {
      maskImage.onload = resolve;
    });

    canvas.width = imageA.width;
    canvas.height = imageA.height;

    ctx?.drawImage(imageA, 0, 0);

    const maskWidth = coords.x_max - coords.x_min;
    const maskHeight = coords.y_max - coords.y_min;

    // デバッグ用のコンソールログ
    console.log('顔座標:', coords);
    console.log('マスクの幅:', maskWidth, '高さ:', maskHeight);

    // 座標に基づいてマスクを描画
    ctx?.drawImage(maskImage, coords.x_min, coords.y_min, maskWidth, maskHeight);

    // 結果画像を生成して保存
    const finalImage = canvas.toDataURL();
    setFinalImageSrc(finalImage); // finalImageSrc に保存
  };

  return (
    <div className="w-full flex justify-center flex-col items-center mt-10">
      <h1 className="text-3xl font-bold mt-4">顔マスク君</h1>

      {/* ドロップゾーン */}
      {!filePreview && (
        <div
          {...getRootProps()}
          className="flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg bg-white cursor-pointer md:w-auto h-auto lg:w-96 h-28 mt-10"
        >
          <input {...getInputProps()} />
          <p className="text-gray-500 m-8 text-center md:text-xs lg:text-sm">
            ここにファイルをドラッグ＆ドロップするか、<br />クリックして選択してください
            <br /> (png, jpeg, jpg)
          </p>
        </div>
      )}

      {/* エラーメッセージの表示 */}
      {errorMessage && (
        <div className="mt-4 text-red-600">{errorMessage}</div>
      )}

      {/* プレビュー表示 */}
      {filePreview && !finalImageSrc && (
        <div className="mt-4">
          <img
            src={filePreview}
            alt="Selected file preview"
            className="w-80 h-80 object-cover border rounded-lg"
          />
        </div>
      )}

      {/* マスクを適用した結果画像の表示 */}
      {finalImageSrc && (
        <div className="mt-4">
          <img
            src={finalImageSrc}
            alt="Final image with mask"
            className="w-80 h-80 object-cover border rounded-lg"
          />
        </div>
      )}

      {/* 顔座標の表示 */}
      {jsonData && (
        <div className="mt-4">
          <p>顔の座標: {JSON.stringify(jsonData)}</p>
        </div>
      )}

      <div className="mt-4 flex space-x-4">
        <Button variant="text" onClick={handleDeleteImage}>画像を削除</Button>
        {filePreview && (
          <Button variant="contained" color="primary" onClick={getFaceCoordinates}>顔をマスク</Button>
        )}
      </div>

      {/* Canvas (hidden) */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
