export function generateCsv(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  // 获取所有可能的键（列名）
  const allKeys = new Set<string>();
  
  // 递归收集所有键
  const collectKeys = (obj: any, prefix = '') => {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        collectKeys(obj[key], fullKey);
      } else {
        allKeys.add(fullKey);
      }
    });
  };
  
  data.forEach(item => collectKeys(item));
  
  const headers = Array.from(allKeys);
  const rows = [headers.join(',')];
  
  // 处理数据行
  data.forEach(item => {
    const row: string[] = [];
    
    headers.forEach(header => {
      // 嵌套属性访问
      const keys = header.split('.');
      let value: any = item;
      
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }
      
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