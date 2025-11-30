import React from 'react';
import { ImageService } from '@services/ImageService';

const Icon = (props) => {
    const {
        name,
        className
    } = props;

    return (
        <img
            alt={name}
            src={ImageService.getImageURL(name)}
            className={className} />
    );
}

export default Icon;