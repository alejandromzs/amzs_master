// my-monorepo/subprojects/ai-tools/src/components/AIToolsTable.js
import React, { useState, useEffect } from 'react';
import rawData from '../ai-tools-data.json'; // Adjust path if needed
import styles from './AIToolsTable.module.css'; // Optional: for CSS Modules

const AIToolsTable = () => {
    const [tools, setTools] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        // Sort data by publishDate (newest first)
        const sortedData = [...rawData].sort((a, b) => {
            // Handle cases where publishDate might be missing or invalid
            const dateA = new Date(a.publishDate);
            const dateB = new Date(b.publishDate);
            if (isNaN(dateA.getTime())) return 1; // Push invalid dates to the end
            if (isNaN(dateB.getTime())) return -1;
            return dateB - dateA;
        });
        setTools(sortedData);
    }, []);

    // Pagination logic
    const indexOfLastTool = currentPage * itemsPerPage;
    const indexOfFirstTool = indexOfLastTool - itemsPerPage;
    const currentTools = tools.slice(indexOfFirstTool, indexOfLastTool);
    const totalPages = Math.ceil(tools.length / itemsPerPage);

    // const paginate = (pageNumber) => setCurrentPage(pageNumber); // Not used in current button setup
    const nextPage = () => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
    const prevPage = () => setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));

    // Basic date formatter (can be improved)
    const formatDate = (dateString) => {
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString(undefined, options);
        } catch (error) {
            return 'Invalid Date';
        }
    };

    return (
        <div className={styles.tableContainer}>
            <h2>AI Tools List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Pros</th>
                        <th>Cons</th>
                        <th>Ranking</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {currentTools.map(tool => (
                        <tr key={tool.id}>
                            <td>{formatDate(tool.publishDate)}</td>
                            <td><a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.name}</a></td>
                            <td>{Array.isArray(tool.pros) ? tool.pros.join(', ') : tool.pros}</td>
                            <td>{Array.isArray(tool.cons) ? tool.cons.join(', ') : tool.cons}</td>
                            <td>{tool.ranking}</td>
                            <td>{tool.type}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={styles.paginationControls}>
                <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
            </div>
        </div>
    );
};

export default AIToolsTable;
