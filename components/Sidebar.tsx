import { Stethoscope, SidebarClose } from 'lucide-react'

const Sidebar = () => {
  return (
    <aside className="h-full w-64 bg-accent-2/30">
      <div className='flex justify-between items-center h-12 p-4'>
        <Stethoscope className="text-white" />
        <SidebarClose className='size-5 hover:scale-110 transition-transform duration-150 text-white'/>
      </div>
    </aside>
  )
}

export default Sidebar