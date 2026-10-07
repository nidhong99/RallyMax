/**
 * Script import dữ liệu sân cầu lông từ file CSV của Apify vào Supabase
 * Hỗ trợ import 1 file, nhiều file, hoặc TỰ ĐỘNG import toàn bộ các quận (HN_*.csv)
 *
 * Cách sử dụng:
 *   1. Import 1 file cụ thể:
 *      node scripts/import_venues.cjs HN_BD.csv
 *
 *   2. Import nhiều file cùng lúc:
 *      node scripts/import_venues.cjs HN_BD.csv HN_TH.csv HN_DD.csv
 *
 *   3. TỰ ĐỘNG quét và import TOÀN BỘ các file quận trong thư mục:
 *      node scripts/import_venues.cjs all
 *      (hoặc đơn giản là: node scripts/import_venues.cjs)
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

// Danh mục quận hợp lệ đã có trong Supabase Database
const VALID_DISTRICT_CODES = new Set([
  'HN_BD', 'HN_CG', 'HN_TX', 'HN_HBT', 'HN_DD', 'HN_HK',
  'HN_HM', 'HN_LB', 'HN_TH', 'HN_NTL', 'HN_BTL', 'HN_HD',
  'HN_GL', 'HN_TT', 'HN_HDC', 'HN_DA',
  'HCM_Q1', 'HCM_Q10', 'HCM_TB', 'HCM_BTH', 'DN_HC'
]);

// 2. Hàm parse CSV chuẩn (xử lý dấu phẩy và ngắt dòng trong ngoặc kép)
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

// 3. Hàm tự động dò district_code từ chuỗi địa chỉ kèm fallback theo tên file
function detectDistrictCode(address, fallbackDistrict = 'HN_CG') {
  const addr = (address || '').toLowerCase();

  // Kiểm tra từ khóa cụ thể trong địa chỉ
  if (addr.includes('cầu giấy') || addr.includes('nghĩa đô') || addr.includes('dịch vọng') || addr.includes('trần thái tông') || addr.includes('duy tân')) return 'HN_CG';
  if (addr.includes('ba đình') || addr.includes('đội cấn') || addr.includes('ngọc hà') || addr.includes('giảng võ') || addr.includes('kim mã') || addr.includes('liễu giai') || addr.includes('quán thánh') || addr.includes('vĩnh phúc') || addr.includes('phúc xá') || addr.includes('trúc bạch') || addr.includes('cống vị') || addr.includes('thành công') || addr.includes('điện biên') || addr.includes('tân ấp')) return 'HN_BD';
  if (addr.includes('đống đa') || addr.includes('ô chợ dừa') || addr.includes('láng thượng') || addr.includes('láng hạ') || addr.includes('chùa bộc') || addr.includes('thái hà') || addr.includes('hoàng cầu')) return 'HN_DD';
  if (addr.includes('thanh xuân') || addr.includes('khuất duy tiến') || addr.includes('nguyễn trãi') || addr.includes('khương trung') || addr.includes('khương đình') || addr.includes('vũ hữu')) return 'HN_TX';
  if (addr.includes('hai bà trưng') || addr.includes('minh khai') || addr.includes('vĩnh tuy') || addr.includes('bách khoa') || addr.includes('bạch mai') || addr.includes('thanh nhàn') || addr.includes('trương định')) return 'HN_HBT';
  if (addr.includes('nam từ liêm') || addr.includes('từ liêm') || addr.includes('xuân phương') || addr.includes('mỹ đình') || addr.includes('trịnh văn bô') || addr.includes('mễ trì') || addr.includes('đại mỗ')) return 'HN_NTL';
  if (addr.includes('bắc từ liêm') || addr.includes('tây tựu') || addr.includes('phú diễn') || addr.includes('xuân đỉnh') || addr.includes('đông ngạc') || addr.includes('cổ nhuế') || addr.includes('minh khai - bắc từ liêm')) return 'HN_BTL';
  if (addr.includes('hà đông') || addr.includes('la khê') || addr.includes('yên nghĩa') || addr.includes('văn khê') || addr.includes('mộ lao') || addr.includes('văn quán') || addr.includes('hà trì')) return 'HN_HD';
  if (addr.includes('thanh trì') || addr.includes('thanh liệt') || addr.includes('triều khúc') || addr.includes('tân triều') || addr.includes('ngọc hồi') || addr.includes('phan trọng tuệ')) return 'HN_TT';
  if (addr.includes('hoàng mai') || addr.includes('định công') || addr.includes('hoàng liệt') || addr.includes('ao sào') || addr.includes('phương liệt') || addr.includes('lĩnh nam') || addr.includes('vĩnh hưng')) return 'HN_HM';
  if (addr.includes('tây hồ') || addr.includes('võ chí công') || addr.includes('xuân la') || addr.includes('yên phụ') || addr.includes('quảng an') || addr.includes('nhật tân') || addr.includes('thụy khuê')) return 'HN_TH';
  if (addr.includes('long biên') || addr.includes('bồ đề') || addr.includes('ngọc lâm') || addr.includes('gia thụy') || addr.includes('sài đồng') || addr.includes('thạch bàn')) return 'HN_LB';
  if (addr.includes('hoàn kiếm') || addr.includes('trần hưng đạo') || addr.includes('hàng bông') || addr.includes('tràng tiền') || addr.includes('cửa nam') || addr.includes('lý thường kiệt')) return 'HN_HK';
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

  // Nếu không nhận diện được qua địa chỉ, dùng fallback của file (ví dụ file HN_BD.csv -> HN_BD)
  if (fallbackDistrict && VALID_DISTRICT_CODES.has(fallbackDistrict)) {
    return fallbackDistrict;
  }

  return 'HN_CG';
}

// 4. Hàm kiểm tra địa điểm có phải sân cầu lông không
function isBadmintonVenue(row) {
  const cat = (row.categoryName || row['categories/0'] || '').toLowerCase();
  const title = (row.title || '').toLowerCase();

  // Bỏ qua các cửa hàng bán đồ thể thao / căng vợt / shop
  if (cat.includes('store') || cat.includes('shop') || title.includes('shop') || title.includes('thế giới cầu lông') || title.includes('cửa hàng') || title.includes('băng cơ')) {
    return false;
  }

  // Bỏ qua các môn khác: bơi lội, bóng đá, pickleball độc lập, tennis độc lập
  if (cat.includes('swimming') || cat.includes('soccer') || title.includes('bóng trung kính') || title.includes('bể bơi') || title.includes('sân bóng') || title.includes('công viên')) {
    return false;
  }

  // Chấp nhận nếu category hoặc title có chữ cầu lông / badminton / sports complex / athletic club
  if (cat.includes('badminton') || cat.includes('sports complex') || cat.includes('athletic club') || title.includes('cầu lông') || title.includes('badminton') || title.includes('nhà thi đấu')) {
    return true;
  }

  return false;
}

// 4.1 Hàm trích xuất tối đa 10 ảnh mới nhất / nổi bật của mỗi sân
function extractGalleryImages(row) {
  const images = [];

  // A. Kiểm tra mảng hoặc JSON trong images / imageUrls / photos
  const candidateKeys = ['images', 'imageUrls', 'photos', 'photosUrls'];
  for (const k of candidateKeys) {
    if (row[k]) {
      try {
        const parsed = typeof row[k] === 'string' && (row[k].startsWith('[') || row[k].startsWith('{')) ? JSON.parse(row[k]) : row[k];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const url = typeof item === 'string' ? item : (item.imageUrl || item.url || item.photoUrl || '');
            if (url && typeof url === 'string' && url.startsWith('http') && !images.includes(url)) {
              images.push(url);
            }
          }
        }
      } catch (e) {
        if (typeof row[k] === 'string' && row[k].includes('http')) {
          const parts = row[k].split(/[\n,;]+/);
          for (const p of parts) {
            const trimmed = p.trim();
            if (trimmed.startsWith('http') && !images.includes(trimmed)) {
              images.push(trimmed);
            }
          }
        }
      }
    }
  }

  // B. Kiểm tra các cột dạng flattened: images/0, images/1, ... hoặc imageUrls/0... hoặc photos/0...
  for (let i = 0; i < 50; i++) {
    const colPatterns = [
      `images/${i}`,
      `images/${i}/imageUrl`,
      `images/${i}/url`,
      `imageUrls/${i}`,
      `photos/${i}`,
      `photos/${i}/imageUrl`,
      `photos/${i}/url`
    ];
    for (const col of colPatterns) {
      const val = (row[col] || '').trim();
      if (val && val.startsWith('http') && !images.includes(val)) {
        images.push(val);
      }
    }
  }

  // C. Nếu có imageUrl mà chưa có trong danh sách, ưu tiên chèn lên đầu
  const singleImage = (row.imageUrl || '').trim();
  if (singleImage && singleImage.startsWith('http') && !images.includes(singleImage)) {
    images.unshift(singleImage);
  }

  // D. Lấy tối đa 10 ảnh (nếu ít hơn 10 thì lấy toàn bộ ảnh hiện có)
  return images.slice(0, 10);
}

// 5. Hàm import 1 file CSV
async function importSingleFile(csvFile, fileIndex, totalFiles) {
  const fileName = path.basename(csvFile);
  const districtFromFileName = fileName.replace('.csv', '').toUpperCase();
  const fallbackDistrict = VALID_DISTRICT_CODES.has(districtFromFileName) ? districtFromFileName : 'HN_CG';

  console.log(`\n================================================================`);
  console.log(`📁 [${fileIndex}/${totalFiles}] Đang xử lý: ${fileName} (Quận mặc định: ${fallbackDistrict})`);
  console.log(`================================================================`);

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ Không tìm thấy file: ${csvFile}`);
    return { fileName, total: 0, valid: 0, inserted: 0, errors: 0 };
  }

  const content = fs.readFileSync(csvFile, 'utf-8');
  const rawRows = parseCSV(content);
  console.log(`• Đã đọc ${rawRows.length} dòng thô.`);

  const validVenues = [];
  let skippedCount = 0;

  for (const row of rawRows) {
    const title = (row.title || '').trim();
    const address = (row.address || '').trim();
    const mapsUrl = (row.url || '').trim();
    const lat = parseFloat(row['location/lat']) || null;
    const lng = parseFloat(row['location/lng']) || null;

    if (!title || !address) continue;

    if (!isBadmintonVenue(row)) {
      skippedCount++;
      continue;
    }

    const districtCode = detectDistrictCode(address, fallbackDistrict);
    const galleryImages = extractGalleryImages(row);
    const coverImage = (row.imageUrl || '').trim() || (galleryImages[0] || null);

    validVenues.push({
      name: title,
      address: address,
      district_code: districtCode,
      maps_url: mapsUrl,
      latitude: lat,
      longitude: lng,
      image_url: coverImage,
      gallery_images: galleryImages,
    });
  }

  console.log(`• Lọc được ${validVenues.length} sân hợp lệ (Đã bỏ qua ${skippedCount} cửa hàng/môn khác).`);
  console.log(`• Đang đẩy lên Supabase (chống trùng lặp theo Tên + Địa chỉ)...`);

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
          gallery_images: venue.gallery_images,
        },
        { onConflict: 'name,address' }
      )
      .select();

    if (error) {
      console.error(`  ❌ Lỗi sân "${venue.name}":`, error.message);
      errorCount++;
    } else {
      insertedCount++;
    }
  }

  console.log(`✔️ Hoàn thành ${fileName}: Đã lưu/cập nhật ${insertedCount} sân | Lỗi: ${errorCount}`);
  return { fileName, total: rawRows.length, valid: validVenues.length, inserted: insertedCount, errors: errorCount };
}

// 6. Main Runner
async function main() {
  const args = process.argv.slice(2);
  let targetFiles = [];

  if (args.length === 0 || args[0].toLowerCase() === 'all') {
    // Tự động tìm tất cả file HN_*.csv trong thư mục làm việc
    const dirFiles = fs.readdirSync(process.cwd());
    targetFiles = dirFiles
      .filter(f => f.startsWith('HN_') && f.endsWith('.csv'))
      .sort()
      .map(f => path.resolve(process.cwd(), f));

    if (targetFiles.length === 0) {
      console.log('Không tìm thấy file HN_*.csv nào. Dùng file mẫu venues_sample.csv...');
      targetFiles = [path.resolve(__dirname, '../venues_sample.csv')];
    }
  } else {
    // Người dùng truyền 1 hoặc nhiều file cụ thể
    targetFiles = args.map(f => path.resolve(process.cwd(), f));
  }

  console.log(`\n🚀 RALLYMAX VENUE BULK IMPORTER`);
  console.log(`• Tìm thấy ${targetFiles.length} file CSV để xử lý.`);
  console.log(`• Supabase URL: ${supabaseUrl}`);

  const results = [];
  for (let i = 0; i < targetFiles.length; i++) {
    const res = await importSingleFile(targetFiles[i], i + 1, targetFiles.length);
    results.push(res);
  }

  // Bảng tổng kết
  console.log(`\n================================================================`);
  console.log(`📊 BẢNG TỔNG KẾT IMPORT SÂN CẦU LÔNG`);
  console.log(`================================================================`);
  console.log(`| File CSV            | Tổng dòng | Sân hợp lệ | Thành công | Lỗi |`);
  console.log(`|---------------------|-----------|------------|------------|-----|`);
  let sumValid = 0;
  let sumInserted = 0;
  let sumErrors = 0;

  for (const r of results) {
    sumValid += r.valid;
    sumInserted += r.inserted;
    sumErrors += r.errors;
    const fName = r.fileName.padEnd(19);
    const tot = String(r.total).padStart(9);
    const val = String(r.valid).padStart(10);
    const ins = String(r.inserted).padStart(10);
    const err = String(r.errors).padStart(3);
    console.log(`| ${fName} | ${tot} | ${val} | ${ins} | ${err} |`);
  }
  console.log(`|---------------------|-----------|------------|------------|-----|`);
  console.log(`| TỔNG CỘNG           |           | ${String(sumValid).padStart(10)} | ${String(sumInserted).padStart(10)} | ${String(sumErrors).padStart(3)} |`);
  console.log(`================================================================\n`);

  // Truy vấn tổng số sân thực tế đang có trên database
  const { count } = await supabase.from('venues').select('*', { count: 'exact', head: true });
  console.log(`🎉 Tổng số sân thực tế đang lưu trong Supabase Database: ${count} sân.\n`);
}

main().catch(console.error);
