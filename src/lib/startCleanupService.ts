import { cleanupService } from '@/storage/database';

// 在服务端启动清理服务
cleanupService.startCleanupScheduler();

console.log('数据清理服务已启动');