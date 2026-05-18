'use client';

export default function TestPage() {
  console.log('TestPage rendered');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          测试页面
        </h1>
        <p className="text-gray-600">
          如果您能看到这个内容，说明客户端渲染正常。
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">测试成功！页面可以正常渲染。</p>
        </div>
      </div>
    </div>
  );
}