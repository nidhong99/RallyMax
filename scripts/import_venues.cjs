/**
 * Script import dữ liệu sân cầu lông từ file CSV của Apify vào Supabase
 * Sử dụng: node scripts/import_venues.cjs [đường_dẫn_file_csv]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Đọc cấu hình từ .env
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = 'https://bftfiwyheqikuldiorfg.supabase.co';
let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGZpd3loZXFpa3VsZGlvcmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjIxMDMsImV4cCI6MjEwNDQzODEwM30.ADdPlvrpnV2L6cOlAE6daA-sWmDyug71Oq_iwfeMmao';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key?.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val?.trim();
    if (key?.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = val?.trim();
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Hàm parse CSV chuẩn (xử lý dấu phẩy trong ngoặc kép)
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  return rows;
}

// 3. Hàm tự động dò district_code từ chuỗi địa chỉ
function detectDistrictCode(address) {
  const addr = (address || '').toLowerCase();
  if (addr.includes('cầu giấy') || addr.includes('nghĩa đô') || addr.includes('dịch vọng') || addr.includes('trần thái tông') || addr.includes('duy tân')) return 'HN_CG';
  if (addr.includes('ba đình') || addr.includes('đội cấn') || addr.includes('ngọc hà') || addr.includes('giảng võ') || addr.includes('kim mã') || addr.includes('liễu giai') || addr.includes('quán thánh') || addr.includes('vĩnh phúc') || addr.includes('phúc xá') || addr.includes('trúc bạch') || addr.includes('cống vị') || addr.includes('thành công') || addr.includes('điện biên') || addr.includes('tân ấp')) return 'HN_BD';
  if (addr.includes('đống đa') || addr.includes('ô chợ dừa') || addr.includes('láng thượng') || addr.includes('láng hạ') || addr.includes('chùa bộc') || addr.includes('thái hà') || addr.includes('hoàng cầu')) return 'HN_DD';
  if (addr.includes('thanh xuân') || addr.includes('khuất duy tiến') || addr.includes('nguyễn trãi') || addr.includes('khương trung') || addr.includes('khương đình') || addr.includes('vũ hữu')) return 'HN_TX';
  if (addr.includes('hai bà trưng') || addr.includes('minh khai') || addr.includes('vĩnh tuy') || addr.includes('bách khoa') || addr.includes('bạch mai') || addr.includes('thanh nhàn') || addr.includes('trương định')) return 'HN_HBT';
  if (addr.includes('nam từ liêm') || addr.includes('từ liêm') || addr.includes('xuân phương') || addr.includes('mỹ đình') || addr.includes('trịnh văn bô')) return 'HN_NTL';
  if (addr.includes('bắc từ liêm') || addr.includes('tây tựu') || addr.includes('phú diễn') || addr.includes('xuân đỉnh') || addr.includes('đông ngạc')) return 'HN_BTL';
  if (addr.includes('hà đông') || addr.includes('la khê') || addr.includes('yên nghĩa') || addr.includes('văn khê')) return 'HN_HD';
  if (addr.includes('thanh trì') || addr.includes('thanh liệt') || addr.includes('triều khúc') || addr.includes('tân triều') || addr.includes('ngọc hồi') || addr.includes('phan trọng tuệ')) return 'HN_TT';
  if (addr.includes('hoàng mai') || addr.includes('định công') || addr.includes('hoàng liệt') || addr.includes('ao sào') || addr.includes('phương liệt')) return 'HN_HM';
  if (addr.includes('tây hồ') || addr.includes('võ chí công') || addr.includes('xuân la') || addr.includes('yên phụ') || addr.includes('quảng an') || addr.includes('nhật tân')) return 'HN_TH';
  if (addr.includes('long biên') || addr.includes('bồ đề') || addr.includes('ngọc lâm')) return 'HN_LB';
  if (addr.includes('hoàn kiếm') || addr.includes('trần hưng đạo') || addr.includes('hàng bông') || addr.includes('tràng tiền')) return 'HN_HK';
  if (addr.includes('gia lâm')) return 'HN_GL';
  if (addr.includes('hoài đức')) return 'HN_HDC';
  if (addr.includes('đông anh')) return 'HN_DA';

  // HCM check
  if (addr.includes('hồ chí minh') || addr.includes('ho chi minh')) {
    if (addr.includes('tân bình') || addr.includes('bảy hiền')) return 'HCM_TB';
    if (addr.includes('quận 10') || addr.includes('hòa hưng')) return 'HCM_Q10';
    if (addr.includes('quận 1')) return 'HCM_Q1';
    if (addr.includes('bình thạnh')) return 'HCM_BTH';
  }

  return 'HN_CG'; // Fallback mặc định
}

// 4. Hàm kiểm tra địa điểm có phải sân cầu lông không
function isBadmintonVenue(row) {
  const cat = (row.categoryName || row['categories/0'] || '').toLowerCase();
  const title = (row.title || '').toLowerCase();

  // Bỏ qua các cửa hàng bán đồ thể thao / căng vợt
  if (cat.includes('store') || cat.includes('shop') || title.includes('shop') || title.includes('thế giới cầu lông') || title.includes('cửa hàng') || title.includes('băng cơ')) {
    return false;
  }

  // Bỏ qua các môn khác: bơi lội, bóng đá, pickleball độc lập, tennis độc lập
  if (cat.includes('swimming') || cat.includes('soccer') || title.includes('bóng trung kính') || title.includes('bể bơi') || title.includes('sân bóng') || title.includes('công viên')) {
    return false;
  }

  // Chấp nhận nếu category hoặc title có chữ cầu lông / badminton / sports complex
  if (cat.includes('badminton') || cat.includes('sports complex') || cat.includes('athletic club') || title.includes('cầu lông') || title.includes('badminton') || title.includes('nhà thi đấu')) {
    return true;
  }

  return false;
}

// 5. Main Execute
async function main() {
  const csvFile = process.argv[2] || path.resolve(__dirname, '../venues_sample.csv');
  console.log(`Đang đọc file: ${csvFile}...`);

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ Không tìm thấy file: ${csvFile}`);
    console.log(`💡 Cách dùng: node scripts/import_venues.cjs <đường_dẫn_file_csv>`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvFile, 'utf-8');
  const rawRows = parseCSV(content);
  console.log(`Đã đọc ${rawRows.length} dòng từ file CSV.`);

  const validVenues = [];
  const skipped = [];

  for (const row of rawRows) {
    const title = (row.title || '').trim();
    const address = (row.address || '').trim();
    const mapsUrl = (row.url || '').trim();
    const lat = parseFloat(row['location/lat']) || null;
    const lng = parseFloat(row['location/lng']) || null;
    const imageUrl = (row.imageUrl || '').trim() || null;

    if (!title || !address) {
      continue;
    }

    if (!isBadmintonVenue(row)) {
      skipped.push({ title, reason: 'Không phải sân cầu lông (Cửa hàng/Bóng đá/Tennis/Công viên)' });
      continue;
    }

    const districtCode = detectDistrictCode(address);

    validVenues.push({
      name: title,
      address: address,
      district_code: districtCode,
      maps_url: mapsUrl,
      latitude: lat,
      longitude: lng,
      image_url: imageUrl,
    });
  }

  console.log(`\n✅ Lọc được ${validVenues.length} sân cầu lông hợp lệ.`);
  console.log(`⏩ Đã bỏ qua ${skipped.length} địa điểm không phải sân cầu lông.`);

  console.log(`\nĐang đẩy dữ liệu lên Supabase (${supabaseUrl})...`);

  let insertedCount = 0;
  let errorCount = 0;

  for (const venue of validVenues) {
    const { data, error } = await supabase
      .from('venues')
      .upsert(
        {
          name: venue.name,
          address: venue.address,
          district_code: venue.district_code,
          maps_url: venue.maps_url,
          latitude: venue.latitude,
          longitude: venue.longitude,
          image_url: venue.image_url,
        },
        { onConflict: 'name,address' }
      )
      .select();

    if (error) {
      console.error(`❌ Lỗi sân "${venue.name}":`, error.message);
      errorCount++;
    } else {
      const hasImg = venue.image_url ? '📸' : '⚪';
      console.log(`✔️ [${venue.district_code}] ${hasImg} ${venue.name} (${venue.address.slice(0, 40)}...)`);
      insertedCount++;
    }
  }

  console.log(`\n🎉 HOÀN THÀNH: Thành công: ${insertedCount} sân | Lỗi: ${errorCount}`);
}

main().catch(console.error);
