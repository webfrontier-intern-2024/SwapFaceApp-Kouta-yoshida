"use client";
import React, { useState, useEffect } from 'react';
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
  const [faceCoordinates, setFaceCoordinates] = useState<any[]>([]);
  const [jsonData, setJsonData] = useState<Datas | null>(null);

  // 顔座標を取得する処理
  const getFaceCoordinates = async () => {
    if (!selectedFile) return;

    // フォームデータを作成
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Next.jsのAPIルートにリクエストを送信
      const apiUrl = "/api/upload";
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData, // ファイルを含んだフォームデータを送信
      });

      if (response.ok) {
        const result = await response.json();

        // result.box が正しく取得できる場合
        if (result.box) {
          const data = result.box;
          const datas: Datas = {
            x_max: data.x_max,
            y_max: data.y_max,
            x_min: data.x_min,
            y_min: data.y_min,
            probability: data.probability || 1, // probabilityを修正
          };
          setJsonData(datas);
          setFaceCoordinates([datas]); // faceCoordinatesに新しいデータを設定
        }
      } else {
        console.error('APIリクエストが失敗しました');
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

  // ドロップゾーンの設定
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [".png", ".jpeg", ".jpg"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setFaceCoordinates([]); // 新しい画像を選択したら顔座標をリセット
      }
    },
  });

  // 画像を削除する処理
  const handleDeleteImage = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFaceCoordinates([]);
  };

  return (
    <div className="w-full flex justify-center flex-col items-center mt-10">
      {/* タイトル */}
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

      {/* プレビュー表示 */}
      {filePreview && (
        <div className="mt-4">
          <img
            src={filePreview}
            alt="Selected file preview"
            className="w-80 h-80 object-cover border rounded-lg"
          />
        </div>
      )}

      {/* 顔座標の表示 */}
      {jsonData && (
        <div className="mt-4">
          <p>顔座標: {JSON.stringify(jsonData)}</p>
        </div>
      )}

      {/* MUIボタン */}
      <div className="mt-4 flex space-x-4">
        <Button variant="text" onClick={handleDeleteImage}>画像を削除</Button>
        {filePreview && (
          <Button variant="contained" color="primary" onClick={getFaceCoordinates}>顔座標を取得</Button>
        )}
      </div>
    </div>
  );
}
