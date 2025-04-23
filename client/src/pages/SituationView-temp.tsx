  return (
    <div className="container mx-auto px-4 py-8">
      {chapterId && moduleId ? (
        <BackButton 
          to={`/training/chapter/${chapterId}/module/${moduleId}`} 
          label="Back to Module" 
        />
      ) : moduleId ? (
        <BackButton 
          to={`/training/module/${moduleId}`} 
          label="Back to Module" 
        />
      ) : (
        <BackButton 
          to="/training" 
          label="Back to Training" 
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">