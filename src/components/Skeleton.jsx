import { useEffect, useState } from 'react'

export function SkeletonBox({ className }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-12 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <SkeletonBox className="h-6 w-24 mb-4" />
            <SkeletonBox className="h-10 w-20" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <SkeletonBox key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function ListsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-12 w-32" />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700">
          {[1,2,3,4,5,6].map(i => (
            <SkeletonBox key={i} className="h-4 w-full" />
          ))}
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
            {[1,2,3,4,5,6].map(j => (
              <SkeletonBox key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-10 w-32" />
      </div>
      
      <SkeletonBox className="h-12 w-full rounded-xl" />
      
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 dark:bg-gray-700">
          {[1,2,3,4].map(i => (
            <SkeletonBox key={i} className="h-4 w-full col-span-3" />
          ))}
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b border-gray-100 dark:border-gray-700">
            <SkeletonBox className="h-8 w-full col-span-3" />
            <SkeletonBox className="h-8 w-full col-span-3" />
            <SkeletonBox className="h-8 w-full col-span-5" />
            <SkeletonBox className="h-8 w-full col-span-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
