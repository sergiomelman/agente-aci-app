import React from 'react';

const FileUpload = ({ onFileSelect }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    // Reseta o valor do input para permitir selecionar o mesmo arquivo novamente
    event.target.value = null;
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-500 transition">
      <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-blue-600">Clique para enviar</span> ou arraste e solte
        </p>
        <p className="text-xs text-gray-500">PNG, JPG, PDF, etc.</p>
      </label>
      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
    </div>
  );
};

export default FileUpload;

