import React, { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Download, Table, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import { UserState } from '../types';

interface ResultProps {
  userState: UserState;
  onRestart: () => void;
}

// ======================================================================================
// HƯỚNG DẪN CÀI ĐẶT GOOGLE SHEETS (CẬP NHẬT MỚI NHẤT)
// ======================================================================================
// 1. Vào Google Sheet của bạn.
// 2. Chọn Menu: Tiện ích mở rộng (Extensions) > Apps Script.
// 3. Xóa code cũ, dán đoạn code sau vào file Code.gs:
/*
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    // Tạo tiêu đề đúng theo yêu cầu nếu chưa có
    var headers = sheet.getRange(1, 1, 1, 4).getValues()[0];
    if (headers[0] !== "Timestamp") {
      sheet.getRange(1, 1, 1, 4).setValues([["Timestamp", "MaHocSinh", "DiemSo", "TongSoCau"]]);
    }

    var data = JSON.parse(e.postData.contents);
    var nextRow = sheet.getLastRow() + 1;
    
    // Ghi dữ liệu
    sheet.getRange(nextRow, 1, 1, 4).setValues([[
      "'" + data.timestamp, // Dấu ' để ép kiểu chuỗi cho ngày tháng
      data.maHocSinh,
      data.diemSo,
      data.tongSoCau
    ]]);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
*/
// 4. Nhấn "Triển khai" (Deploy) > "Tùy chọn triển khai mới" (New deployment).
// 5. Chọn loại: "Ứng dụng web" (Web App).
// 6. Cấu hình:
//    - Mô tả: PyMaster Saver V2
//    - Thực thi dưới dạng: "Tôi" (Me)
//    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone) -> QUAN TRỌNG!
// 7. Nhấn "Triển khai" (Deploy), copy URL mới dán vào biến bên dưới.

const APPS_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbwwHcsOFTqRn2QobtqV1UP30Qui_2IU4WgBXZzF2-EH4GJFGZ0QXGoerlHpr2lWbTywGA/exec"; // <--- DÁN URL WEB APP CỦA BẠN VÀO GIỮA 2 DẤU NGOẶC KÉP

const Result: React.FC<ResultProps> = ({ userState, onRestart }) => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [errorMessage, setErrorMessage] = useState('');

  // Link mẫu sheet (để người dùng tham khảo, bạn có thể thay bằng link sheet của bạn)
  const GOOGLE_SHEET_LINK = 'https://docs.google.com/spreadsheets/u/0/';

  useEffect(() => {
    const saveData = async () => {
      // Validate configuration
      if (!APPS_SCRIPT_URL) {
        console.error(`%c[LỖI CẤU HÌNH] Chưa nhập URL Apps Script!`, "color: red; font-size: 16px; font-weight: bold;");
        setSaveStatus('error');
        setErrorMessage('Chưa cấu hình URL Google Sheet');
        return;
      }

      if (APPS_SCRIPT_URL.includes("docs.google.com/spreadsheets")) {
        setSaveStatus('error');
        setErrorMessage('URL sai (Đang điền link Sheet thay vì link Web App)');
        return;
      }

      // Chuẩn bị dữ liệu đúng theo yêu cầu cột
      const questionsAnswered = userState.history.length;
      
      const payload = {
        timestamp: new Date().toLocaleString('vi-VN'), // Thời gian gửi từ client
        maHocSinh: userState.studentCode,
        diemSo: userState.score,
        tongSoCau: questionsAnswered
      };

      try {
        // Gửi request POST tới Google Apps Script Web App
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Bắt buộc với GAS Web App
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Giả định thành công nếu không có lỗi mạng (do no-cors không trả về body)
        setSaveStatus('success');
      } catch (error) {
        console.error("Lỗi khi lưu:", error);
        setSaveStatus('error');
        setErrorMessage('Lỗi kết nối mạng');
      }
    };

    saveData();
  }, [userState]);

  const handleDownloadCSV = () => {
    // Fallback manual download
    const headers = ["Timestamp", "MaHocSinh", "DiemSo", "TongSoCau"];
    const row = [
      new Date().toLocaleString("vi-VN"),
      userState.studentCode,
      userState.score,
      userState.history.length
    ];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add BOM
      + headers.join(",") + "\n" + row.join(",");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ket_qua_${userState.studentCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const percentage = userState.totalQuestions > 0 
    ? Math.round((userState.score / userState.totalQuestions) * 100)
    : 0;

  let title = "Hoàn thành!";
  let color = "text-black";
  if (percentage >= 80) { title = "Xuất sắc!"; color = "text-yellow-500"; }
  else if (percentage >= 50) { title = "Làm tốt lắm!"; color = "text-green-600"; }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto text-center animate-pop">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-black rounded-full blur-xl opacity-10"></div>
        <Trophy size={100} className={`${color} drop-shadow-md`} strokeWidth={1.5} />
      </div>

      <h2 className="text-4xl font-black mb-2">{title}</h2>
      <p className="text-gray-600 mb-8">Mã học sinh: <b>{userState.studentCode}</b></p>

      <div className="w-full bg-white border-2 border-black rounded-xl p-6 mb-6 shadow-hard">
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-500 text-xs uppercase font-bold">Điểm số</p>
            <p className="text-3xl font-black">{userState.score}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-500 text-xs uppercase font-bold">Số câu đã làm</p>
            <p className="text-3xl font-black">{userState.history.length}</p>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-dashed border-gray-200">
          {saveStatus === 'saving' && (
            <p className="text-sm font-bold text-gray-500 flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Đang lưu kết quả...
            </p>
          )}
          {saveStatus === 'success' && (
            <div className="text-green-600">
               <p className="text-sm font-bold flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 size={18}/> Đã lưu vào Google Sheet!
              </p>
              <p className="text-xs text-gray-400">Dữ liệu bao gồm: Timestamp, Mã HS, Điểm, Số câu.</p>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              <p className="font-bold flex items-center justify-center gap-1 mb-2">
                <AlertCircle size={16}/> Lỗi lưu dữ liệu
              </p>
              <p className="text-xs text-gray-600 mb-3">{errorMessage}</p>
              <Button onClick={handleDownloadCSV} variant="secondary" className="w-full text-xs py-2">
                <Download size={14} className="mr-1 inline"/> Tải file CSV (Dự phòng)
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-3">
        <a href={GOOGLE_SHEET_LINK} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" fullWidth className="bg-white text-sm">
            <Table size={16} className="mr-2" /> Mở Google Sheet
          </Button>
        </a>

        <Button onClick={onRestart} fullWidth className="bg-black text-white hover:bg-gray-800">
          <RotateCcw size={18} className="mr-2" /> Quay lại màn hình chính
        </Button>
      </div>
      
      {saveStatus === 'error' && (
         <div className="mt-8 text-xs text-gray-400 max-w-xs mx-auto bg-gray-100 p-2 rounded text-left">
            <b>Lưu ý cho Admin:</b><br/>
            1. Mở file <code>components/Result.tsx</code>.<br/>
            2. Copy code Apps Script trong comment.<br/>
            3. Dán vào Google Sheet Extensions > Apps Script.<br/>
            4. Deploy dưới dạng Web App (Anyone).<br/>
            5. Dán URL vào biến <code>APPS_SCRIPT_URL</code>.
        </div>
      )}
    </div>
  );
};

export default Result;