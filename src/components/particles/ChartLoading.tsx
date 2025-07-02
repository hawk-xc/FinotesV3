import { ChartBar } from 'lucide-react';

const ChartLoading = () => {
    return (
        <div className='flex w-full gap-2 flex-col h-[200px] text-slate-500 justify-center align-middle items-center'>
            <ChartBar />
            <span className="text-xs">memuat bagan...</span>
        </div>
    )
}

export default ChartLoading;