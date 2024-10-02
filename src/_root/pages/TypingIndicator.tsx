const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 animate-pulse">
      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
    </div>
  );
};

export default TypingIndicator;