/**
 * 将数据转换为CSV格式
 */
export function generateCsv(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  // 获取所有可能的键（列名）
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      allKeys.add(key);
    });
  });
  
  const headers = Array.from(allKeys);
  const rows = [headers.join(',')];
  
  // 处理数据行
  data.forEach(item => {
    const row: string[] = [];
    
    headers.forEach(header => {
      let value = item[header];
      
      if (value === undefined || value === null) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      
      // 转义特殊字符
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      row.push(value);
    });
    
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}