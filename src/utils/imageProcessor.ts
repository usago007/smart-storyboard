/**
 * 图片处理工具类
 * 主要用于将彩色图片转换为黑白图片
 */

export interface ImageProcessingOptions {
  /** 是否使用灰度算法，默认true */
  useGrayscale?: boolean;
  /** 阈值设置，用于二值化（0-255），默认128 */
  threshold?: number;
  /** 是否应用对比度增强，默认true */
  enhanceContrast?: boolean;
}

/**
 * 将彩色图片转换为黑白图片
 * @param imageUrl 原始图片URL
 * @param options 处理选项
 * @returns 处理后的图片Blob URL
 */
export async function convertToBlackWhite(
  imageUrl: string,
  options: ImageProcessingOptions = {}
): Promise<string> {
  const {
    useGrayscale = true,
    threshold = 128,
    enhanceContrast = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 设置跨域属性
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // 创建Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('无法创建Canvas上下文');
        }
        
        // 设置Canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原始图片
        ctx.drawImage(img, 0, 0);
        
        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 处理每个像素
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (useGrayscale) {
            // 使用加权平均法计算灰度值
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            if (threshold !== undefined) {
              // 二值化处理
              const binary = gray > threshold ? 255 : 0;
              
              // 应用对比度增强
              const finalValue = enhanceContrast 
                ? (binary === 255 ? 240 : 15) // 增强对比度
                : binary;
              
              data[i] = finalValue;     // R
              data[i + 1] = finalValue; // G
              data[i + 2] = finalValue; // B
            } else {
              // 纯灰度
              data[i] = gray;     // R
              data[i + 1] = gray; // G
              data[i + 2] = gray; // B
            }
          } else {
            // 简单平均法（效果较差）
            const avg = (r + g + b) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
          }
        }
        
        // 将处理后的数据重新绘制到Canvas
        ctx.putImageData(imageData, 0, 0);
        
        // 转换为Blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl);
          } else {
            reject(new Error('无法创建图片Blob'));
          }
        }, 'image/jpeg', 0.95); // 使用高质量JPEG
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    // 开始加载图片
    img.src = imageUrl;
  });
}

/**
 * 服务器端图片处理（Node.js环境）
 * 使用Sharp库进行图片处理
 */
export async function convertToBlackWhiteServer(
  imageBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<Buffer> {
  const sharp = require('sharp');
  const {
    useGrayscale = true,
    threshold = 128,
    enhanceContrast = true
  } = options;

  try {
    let pipeline = sharp(imageBuffer);
    
    if (useGrayscale) {
      // 转换为灰度
      pipeline = pipeline.greyscale();
      
      if (threshold !== undefined) {
        // 二值化处理
        pipeline = pipeline.threshold(threshold);
      }
      
      if (enhanceContrast) {
        // 增强对比度
        pipeline = pipeline.linear(
          [1.5, 0, 0], // R通道增强
          [0, 1.5, 0], // G通道增强  
          [0, 0, 1.5], // B通道增强
          [0, 0, 0]    // Alpha通道
        );
      }
    }
    
    return await pipeline.jpeg({ quality: 95 }).toBuffer();
    
  } catch (error) {
    throw new Error(`服务器端图片处理失败: ${error}`);
  }
}

/**
 * 验证图片是否为黑白
 * @param imageUrl 图片URL
 * @returns 验证结果
 */
export async function validateBlackWhite(imageUrl: string): Promise<{
  isBlackWhite: boolean;
  colorVariance: number;
  details: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalVariance = 0;
        let pixelCount = 0;
        
        // 计算颜色方差
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 计算RGB值的方差
          const avg = (r + g + b) / 3;
          const variance = ((r - avg) ** 2 + (g - avg) ** 2 + (b - avg) ** 2) / 3;
          
          totalVariance += variance;
          pixelCount++;
        }
        
        const avgVariance = totalVariance / pixelCount;
        
        // 判断是否为黑白（方差小于阈值为黑白）
        const isBlackWhite = avgVariance < 100; // 阈值可调整
        
        resolve({
          isBlackWhite,
          colorVariance: avgVariance,
          details: isBlackWhite 
            ? '图片基本为黑白' 
            : `图片包含彩色元素，平均方差: ${avgVariance.toFixed(2)}`
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    img.src = imageUrl;
  });
}